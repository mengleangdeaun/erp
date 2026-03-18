<?php

namespace App\Services;

use App\Models\Announcement;
use App\Models\HR\Employee;
use App\Models\Notification;

class NotificationService
{
    /**
     * Dispatch in-app notifications when a leave request is submitted.
     */
    public static function leaveRequested(int $employeeId, string $employeeName, int $leaveRequestId): void
    {
        // Find the approver for this employee's leave allocation
        $employee = Employee::with('leaveAllocations')->find($employeeId);
        if (!$employee) return;

        $approverIds = $employee->leaveAllocations->pluck('approved_by')->unique()->filter();

        foreach ($approverIds as $approverId) {
            Notification::create([
                'employee_id' => $approverId,
                'type' => 'leave_request',
                'title' => 'New Leave Request',
                'message' => "{$employeeName} has submitted a leave request awaiting your approval.",
                'data' => ['leave_request_id' => $leaveRequestId],
            ]);
        }
    }

    /**
     * Notify employee when their leave is approved.
     */
    public static function leaveApproved(int $employeeId, string $leaveType): void
    {
        Notification::create([
            'employee_id' => $employeeId,
            'type' => 'leave_approved',
            'title' => 'Leave Approved ✅',
            'message' => "Your {$leaveType} leave request has been approved.",
            'data' => [],
        ]);
    }

    /**
     * Notify employee when their leave is rejected.
     */
    public static function leaveRejected(int $employeeId, string $leaveType, string $reason = ''): void
    {
        Notification::create([
            'employee_id' => $employeeId,
            'type' => 'leave_rejected',
            'title' => 'Leave Request Rejected',
            'message' => "Your {$leaveType} leave request was rejected." . ($reason ? " Reason: {$reason}" : ''),
            'data' => [],
        ]);
    }

    /**
     * Dispatch notifications for an announcement to all targeted employees.
     */
    public static function dispatchAnnouncement(Announcement $announcement): void
    {
        $employees = self::resolveTargetedEmployees($announcement);

        $notifications = $employees->map(fn ($emp) => [
            'employee_id' => $emp->id,
            'type' => 'announcement',
            'title' => $announcement->title,
            'message' => $announcement->short_description,
            'data' => json_encode([
                'announcement_id' => $announcement->id,
                'featured_image' => $announcement->featured_image,
                'has_attachments' => !empty($announcement->attachments)
            ]),
            'created_at' => now(),
            'updated_at' => now(),
        ])->toArray();

        if (!empty($notifications)) {
            Notification::insert($notifications);
        }
    }

    /**
     * Resolve target employees based on announcement targeting settings.
     */
    public static function resolveTargetedEmployees(Announcement $announcement): \Illuminate\Support\Collection
    {
        return match($announcement->targeting_type) {
            'branch' => Employee::whereIn('branch_id', $announcement->target_ids ?? [])->get(),
            'department' => Employee::whereIn('department_id', $announcement->target_ids ?? [])->get(),
            'employee' => Employee::whereIn('id', $announcement->target_ids ?? [])->get(),
            default => Employee::all(), // 'all'
        };
    }

    /**
     * Dispatch announcement to Telegram.
     */
    public static function dispatchTelegram(Announcement $announcement): void
    {
        if (!$announcement->send_telegram) {
            return;
        }

        $service = new TelegramService();
        $setting = \App\Models\TelegramSetting::instance();
        $message = $service->formatAnnouncementMessage($announcement);

        match($announcement->targeting_type) {
            'branch' => \App\Models\HR\Branch::whereIn('id', $announcement->target_ids ?? [])->get()
                ->each(fn ($b) => $b->telegram_chat_id && $service->sendMessage($b->telegram_chat_id, $message, $b->telegram_topic_id)),
            'department' => \App\Models\HR\Department::whereIn('id', $announcement->target_ids ?? [])->get()
                ->each(fn ($d) => $d->telegram_chat_id && $service->sendMessage($d->telegram_chat_id, $message, $d->telegram_topic_id)),
            default => $setting?->global_chat_id && $service->sendMessage($setting->global_chat_id, $message, $setting->global_topic_id),
        };
    }

    /**
     * Recall (delete) all notifications associated with an announcement.
     */
    public static function recallAnnouncement(int $announcementId): void
    {
        Notification::where('type', 'announcement')
            ->where('data->announcement_id', $announcementId)
            ->delete();
    }
}
