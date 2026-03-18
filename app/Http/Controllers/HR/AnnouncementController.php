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
            'is_published'     => 'sometimes|boolean',
            'status'           => 'required|in:draft,published',
            'send_telegram'    => 'sometimes',
            'send_notification' => 'sometimes|boolean',
            'attachments'      => 'nullable|array',
            'attachments.*'    => 'nullable|file',
            'featured_image'   => 'nullable|image|max:5120', // Max 5MB
        ]);

        $data = $validated;
        $data['is_featured'] = $request->boolean('is_featured');
        $data['is_published'] = $request->boolean('is_published');
        $data['send_telegram'] = $request->boolean('send_telegram');

        if ($request->has('target_ids')) {
            $targetIds = $request->input('target_ids');
            $data['target_ids'] = is_string($targetIds) ? json_decode($targetIds, true) : $targetIds;
        }
        
        // Handle Featured Image (Upload vs Library)
        if ($request->hasFile('featured_image')) {
            $data['featured_image'] = $request->file('featured_image')->store('announcements', 'public');
        } elseif ($request->filled('preexisting_featured_image')) {
            $data['featured_image'] = $request->input('preexisting_featured_image');
        }

        // Handle Attachments (Upload vs Library)
        $finalAttachments = [];
        if ($request->hasFile('attachments')) {
            foreach ($request->file('attachments') as $file) {
                $finalAttachments[] = [
                    'name' => $file->getClientOriginalName(),
                    'path' => $file->store('announcements/attachments', 'public'),
                    'size' => $file->getSize(),
                    'type' => $file->getMimeType(),
                ];
            }
        }
        if ($request->has('preexisting_attachments')) {
            $pre = $request->input('preexisting_attachments');
            $pre = is_string($pre) ? json_decode($pre, true) : $pre;
            foreach ((array)$pre as $url) {
                $finalAttachments[] = [
                    'name' => basename($url),
                    'path' => str_replace('/storage/', '', $url),
                    'size' => 0,
                    'type' => 'library',
                ];
            }
        }
        if (!empty($finalAttachments)) {
            $data['attachments'] = $finalAttachments;
        }
        
        if ($data['status'] === 'published' && empty($data['published_at'])) {
            $data['published_at'] = now();
        }

        $announcement = Announcement::create([
            ...$data,
            'created_by' => auth()->id(),
        ]);

        // Dispatch in-app notifications if publishing now AND requested
        // Be lenient with the time check (5 seconds skew) to handle client/server mismatch
        $shouldNotify = $request->boolean('send_notification', true);
        
        if ($shouldNotify && $announcement->is_published && ($announcement->published_at <= now()->addSeconds(5) || empty($announcement->published_at))) {
            NotificationService::dispatchAnnouncement($announcement);

            // Send to Telegram if requested
            if ($announcement->send_telegram) {
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
        $validated = $request->validate([
            'title'            => 'sometimes|string|max:255',
            'type'             => 'sometimes|in:info,success,warning,danger',
            'short_description'=> 'nullable|string',
            'content'          => 'nullable|string',
            'start_date'       => 'nullable|date',
            'end_date'         => 'nullable|date',
            'is_featured'      => 'sometimes',
            'is_published'     => 'sometimes|boolean',
            'targeting_type'   => 'sometimes|in:all,branch,department,employee',
            'target_ids'       => 'nullable',
            'published_at'     => 'nullable|date',
            'status'           => 'sometimes|in:draft,published,expired',
            'send_telegram'    => 'sometimes',
            'send_notification' => 'sometimes|boolean',
        ]);

        $data = $validated;
        if ($request->has('is_featured')) {
            $data['is_featured'] = $request->boolean('is_featured');
        }
        if ($request->has('is_published')) {
            $data['is_published'] = $request->boolean('is_published');
        }
        if ($request->has('send_telegram')) {
            $data['send_telegram'] = $request->boolean('send_telegram');
        }

        if ($request->has('target_ids')) {
            $targetIds = $request->input('target_ids');
            $data['target_ids'] = is_string($targetIds) ? json_decode($targetIds, true) : $targetIds;
        }

        // Handle Featured Image Update (Upload vs Library)
        if ($request->hasFile('featured_image')) {
            if ($announcement->featured_image && !str_contains($announcement->featured_image, 'http')) {
                Storage::disk('public')->delete($announcement->featured_image);
            }
            $data['featured_image'] = $request->file('featured_image')->store('announcements', 'public');
        } elseif ($request->has('preexisting_featured_image')) {
            $data['featured_image'] = $request->input('preexisting_featured_image');
        }

        // Handle Attachments Update (Upload vs Library)
        $finalAttachments = [];
        if ($request->hasFile('attachments')) {
            foreach ($request->file('attachments') as $file) {
                $finalAttachments[] = [
                    'name' => $file->getClientOriginalName(),
                    'path' => $file->store('announcements/attachments', 'public'),
                    'size' => $file->getSize(),
                    'type' => $file->getMimeType(),
                ];
            }
        }
        if ($request->has('preexisting_attachments')) {
            $pre = $request->input('preexisting_attachments');
            $pre = is_string($pre) ? json_decode($pre, true) : $pre;
            foreach ((array)$pre as $url) {
                // If it's already a full URL or a relative path from the library
                $path = str_replace(url('/storage/'), '', $url);
                $path = str_replace('/storage/', '', $path);
                
                $finalAttachments[] = [
                    'name' => basename($url),
                    'path' => $path,
                    'size' => 0,
                    'type' => 'library',
                ];
            }
        }
        
        if (!empty($finalAttachments) || $request->has('attachments') || $request->has('preexisting_attachments')) {
            $data['attachments'] = $finalAttachments;
        }

        if (isset($data['status']) && $data['status'] === 'published' && empty($data['published_at']) && !$announcement->published_at) {
            $data['published_at'] = now();
        }

        // Sync status string with is_published boolean
        if (isset($data['is_published'])) {
            $data['status'] = $data['is_published'] ? 'published' : 'draft';
        }

        $announcement->update($data);

        // If hidden, recall notifications immediately
        if ($announcement->wasChanged('is_published') && !$announcement->is_published) {
            NotificationService::recallAnnouncement($announcement->id);
            // Optionally clear notifications_sent_at so it can re-trigger if re-published
            $announcement->update(['notifications_sent_at' => null]);
        }

        // If just published for the first time, dispatch notifications if requested
        $shouldNotify = $request->boolean('send_notification', true);
        
        if ($shouldNotify && $announcement->is_published && !$announcement->notifications_sent_at && ($announcement->published_at <= now()->addSeconds(5) || empty($announcement->published_at))) {
            NotificationService::dispatchAnnouncement($announcement);

            if ($announcement->send_telegram) {
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
                ->with(['employee' => function($q) {
                    $q->select('id', 'full_name', 'employee_id', 'department_id')
                      ->with('department:id,name');
                }])
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
