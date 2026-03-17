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
            'is_featured'      => 'sometimes',
            'targeting_type'   => 'required|in:all,branch,department,employee',
            'target_ids'       => 'nullable',
            'published_at'     => 'nullable|date',
            'status'           => 'required|in:draft,published',
            'send_telegram'    => 'sometimes',
            'attachments'      => 'nullable|array',
            'attachments.*'    => 'nullable|file',
            'featured_image'   => 'nullable|image|max:5120', // Max 5MB
        ]);

        $data = $validated;
        $data['is_featured'] = $request->boolean('is_featured');
        $data['send_telegram'] = $request->boolean('send_telegram');

        if ($request->has('target_ids')) {
            $targetIds = $request->input('target_ids');
            $data['target_ids'] = is_string($targetIds) ? json_decode($targetIds, true) : $targetIds;
        }
        
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
        // Be lenient with the time check (5 seconds skew) to handle client/server mismatch
        if ($announcement->status === 'published' && ($announcement->published_at <= now()->addSeconds(5) || empty($announcement->published_at))) {
            NotificationService::dispatchAnnouncement($announcement);

            // Send to Telegram if requested
            if ($request->boolean('send_telegram')) {
                NotificationService::dispatchTelegram($announcement);
            }

            $announcement->update(['notifications_sent_at' => now()]);
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
            'is_featured'      => 'sometimes',
            'targeting_type'   => 'sometimes|in:all,branch,department,employee',
            'target_ids'       => 'nullable',
            'published_at'     => 'nullable|date',
            'status'           => 'sometimes|in:draft,published,expired',
            'send_telegram'    => 'sometimes',
        ]);

        $data = $validated;
        if ($request->has('is_featured')) {
            $data['is_featured'] = $request->boolean('is_featured');
        }
        if ($request->has('send_telegram')) {
            $data['send_telegram'] = $request->boolean('send_telegram');
        }

        if ($request->has('target_ids')) {
            $targetIds = $request->input('target_ids');
            $data['target_ids'] = is_string($targetIds) ? json_decode($targetIds, true) : $targetIds;
        }

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
        // Be lenient with time check (5 seconds skew)
        if ($announcement->status === 'published' && !$announcement->notifications_sent_at && ($announcement->published_at <= now()->addSeconds(5) || empty($announcement->published_at))) {
            NotificationService::dispatchAnnouncement($announcement);

            if ($request->boolean('send_telegram')) {
                NotificationService::dispatchTelegram($announcement);
            }

            $announcement->update(['notifications_sent_at' => now()]);
        }

        return response()->json($announcement->load('createdBy'));
    }

    public function destroy(Announcement $announcement)
    {
        NotificationService::recallAnnouncement($announcement->id);
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
