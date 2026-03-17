<?php

namespace App\Http\Controllers\EmployeeApp;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    private function resolveEmployee(Request $request)
    {
        $token = $request->bearerToken();
        return \App\Models\HR\Employee::where('auth_token', $token)->first();
    }

    public function index(Request $request)
    {
        $employee = $this->resolveEmployee($request);
        if (!$employee) return response()->json(['message' => 'Unauthorized'], 401);

        $notifications = Notification::where('employee_id', $employee->id)
            ->orderByDesc('created_at')
            ->limit(50)
            ->get();

        return response()->json($notifications);
    }

    public function unreadCount(Request $request)
    {
        $employee = $this->resolveEmployee($request);
        if (!$employee) return response()->json(['message' => 'Unauthorized'], 401);

        return response()->json([
            'count' => Notification::where('employee_id', $employee->id)->unread()->count(),
        ]);
    }

    public function markRead(Request $request, $id)
    {
        $employee = $this->resolveEmployee($request);
        if (!$employee) return response()->json(['message' => 'Unauthorized'], 401);

        $notification = Notification::where('id', $id)->where('employee_id', $employee->id)->first();
        $notification?->markAsRead();

        return response()->json(['message' => 'Marked as read']);
    }

    public function markAllRead(Request $request)
    {
        $employee = $this->resolveEmployee($request);
        if (!$employee) return response()->json(['message' => 'Unauthorized'], 401);

        Notification::where('employee_id', $employee->id)->unread()->update(['read_at' => now()]);

        return response()->json(['message' => 'All notifications marked as read']);
    }
}
