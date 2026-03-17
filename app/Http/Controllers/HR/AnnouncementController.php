<?php

namespace App\Http\Controllers\HR;

use App\Http\Controllers\Controller;
use App\Models\Announcement;
use App\Models\AnnouncementView;
use App\Models\HR\Branch;
use App\Models\HR\Department;
use App\Models\HR\Employee;
use App\Services\NotificationService;
use App\Services\TelegramService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class AnnouncementController extends Controller
{
    public function index(Request $request)
    {
        $query = Announcement::with('createdBy')
            ->withCount('views')
            ->orderBy('created_at', 'desc');

        if ($request->status) {
            $query->where('status', $request->status);
        }

        return response()->json($query->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title'            => 'required|string|max:255',
            'type'             => 'required|in:info,success,warning,danger',
            'short_description'=> 'nullable|string',
            'content'          => 'nullable|string',
            'start_date'       => 'nullable|date',
            'end_date'         => 'nullable|date|after_or_equal:start_date',
            'is_featured'      => 'boolean',
            'targeting_type'   => 'required|in:all,branch,department,employee',
            'target_ids'       => 'nullable|array',
            'published_at'     => 'nullable|date',
            'status'           => 'required|in:draft,published',
            'send_telegram'    => 'boolean',
            'attachments'      => 'nullable|array',
            'attachments.*'    => 'nullable|file',
            'featured_image'   => 'nullable|image|max:5120', // Max 5MB
        ]);

        $data = $validated;
        
        // Handle Featured Image
        if ($request->hasFile('featured_image')) {
            $data['featured_image'] = $request->file('featured_image')->store('announcements', 'public');
        }

        // Handle Attachments
        if ($request->hasFile('attachments')) {
            $attachments = [];
            foreach ($request->file('attachments') as $file) {
                $attachments[] = [
                    'name' => $file->getClientOriginalName(),
                    'path' => $file->store('announcements/attachments', 'public'),
                    'size' => $file->getSize(),
                    'type' => $file->getClientMimeType(),
                ];
            }
            $data['attachments'] = $attachments;
        }
        if ($data['status'] === 'published' && empty($data['published_at'])) {
            $data['published_at'] = now();
        }

        $announcement = Announcement::create([
            ...$data,
            'created_by' => auth()->id(),
        ]);

        // Dispatch in-app notifications if publishing now
        if ($announcement->status === 'published') {
            NotificationService::dispatchAnnouncement($announcement);

            // Send to Telegram if requested
            if ($request->boolean('send_telegram')) {
                $this->dispatchTelegram($announcement);
            }
        }

        return response()->json($announcement->load('createdBy'), 201);
    }

    public function show(Announcement $announcement)
    {
        return response()->json($announcement->load(['createdBy', 'views'])->loadCount('views'));
    }

    public function update(Request $request, Announcement $announcement)
    {
        $wasPublished = $announcement->status === 'published';

        $validated = $request->validate([
            'title'            => 'sometimes|string|max:255',
            'type'             => 'sometimes|in:info,success,warning,danger',
            'short_description'=> 'nullable|string',
            'content'          => 'nullable|string',
            'start_date'       => 'nullable|date',
            'end_date'         => 'nullable|date',
            'is_featured'      => 'boolean',
            'targeting_type'   => 'sometimes|in:all,branch,department,employee',
            'target_ids'       => 'nullable|array',
            'published_at'     => 'nullable|date',
            'status'           => 'sometimes|in:draft,published,expired',
            'send_telegram'    => 'boolean',
        ]);

        $data = $validated;

        // Handle Featured Image Update
        if ($request->hasFile('featured_image')) {
            if ($announcement->featured_image) {
                Storage::disk('public')->delete($announcement->featured_image);
            }
            $data['featured_image'] = $request->file('featured_image')->store('announcements', 'public');
        }

        // Handle Attachments Update
        if ($request->hasFile('attachments')) {
            // Option: delete old attachments? 
            // For now, let's keep it simple and just append or replace based on frontend logic.
            // If the frontend sends NEW files, we replace the whole set for now.
            $attachments = [];
            foreach ($request->file('attachments') as $file) {
                $attachments[] = [
                    'name' => $file->getClientOriginalName(),
                    'path' => $file->store('announcements/attachments', 'public'),
                    'size' => $file->getSize(),
                    'type' => $file->getClientMimeType(),
                ];
            }
            $data['attachments'] = $attachments;
        }

        if (isset($data['status']) && $data['status'] === 'published' && empty($data['published_at']) && !$announcement->published_at) {
            $data['published_at'] = now();
        }

        $announcement->update($data);

        // If just published for the first time, dispatch notifications
        if (!$wasPublished && $announcement->status === 'published') {
            NotificationService::dispatchAnnouncement($announcement);

            if ($request->boolean('send_telegram')) {
                $this->dispatchTelegram($announcement);
            }
        }

        return response()->json($announcement->load('createdBy'));
    }

    public function destroy(Announcement $announcement)
    {
        $announcement->delete();
        return response()->noContent();
    }

    public function statistics(Announcement $announcement)
    {
        $targeted = NotificationService::resolveTargetedEmployees($announcement)->count();
        $viewed = $announcement->views()->count();

        return response()->json([
            'total_targeted' => $targeted,
            'total_viewed'   => $viewed,
            'engagement_rate' => $targeted > 0 ? round(($viewed / $targeted) * 100, 1) : 0,
            'viewers'        => $announcement->views()
                ->with('employee:id,full_name,employee_id')
                ->orderByDesc('viewed_at')
                ->get(),
        ]);
    }

    public function testTelegram()
    {
        $service = new TelegramService();
        return response()->json($service->testConnection());
    }

    private function dispatchTelegram(Announcement $announcement): void
    {
        $service = new TelegramService();
        $setting = \App\Models\TelegramSetting::instance();
        $message = $service->formatAnnouncementMessage($announcement);

        match($announcement->targeting_type) {
            'branch' => Branch::whereIn('id', $announcement->target_ids ?? [])->get()
                ->each(fn ($b) => $b->telegram_chat_id && $service->sendMessage($b->telegram_chat_id, $message, $b->telegram_topic_id)),
            'department' => Department::whereIn('id', $announcement->target_ids ?? [])->get()
                ->each(fn ($d) => $d->telegram_chat_id && $service->sendMessage($d->telegram_chat_id, $message, $d->telegram_topic_id)),
            default => $setting?->global_chat_id && $service->sendMessage($setting->global_chat_id, $message, $setting->global_topic_id),
        };
    }

    /** Reference data for the form */
    public function formData()
    {
        return response()->json([
            'branches'   => Branch::select('id', 'name')->get(),
            'departments'=> Department::select('id', 'name')->with('branches:id')->get(),
            'employees'  => Employee::select('id', 'full_name', 'employee_id', 'branch_id', 'department_id')
                ->orderBy('full_name')
                ->get(),
        ]);
    }
}
