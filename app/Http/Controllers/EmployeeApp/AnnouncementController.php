<?php

namespace App\Http\Controllers\EmployeeApp;

use App\Http\Controllers\Controller;
use App\Models\Announcement;
use App\Models\AnnouncementView;
use Illuminate\Http\Request;

class AnnouncementController extends Controller
{
    private function resolveEmployee(Request $request)
    {
        $token = $request->bearerToken();
        return \App\Models\HR\Employee::where('auth_token', $token)->first();
    }

    /**
     * List published announcements visible to this employee.
     */
    public function index(Request $request)
    {
        $employee = $this->resolveEmployee($request);
        if (!$employee) return response()->json(['message' => 'Unauthorized'], 401);

        $announcements = Announcement::published()
            ->where(function ($q) use ($employee) {
                $q->where('targeting_type', 'all')
                  ->orWhere(function ($q2) use ($employee) {
                      $q2->where('targeting_type', 'branch')
                         ->whereJsonContains('target_ids', $employee->branch_id);
                  })
                  ->orWhere(function ($q2) use ($employee) {
                      $q2->where('targeting_type', 'department')
                         ->whereJsonContains('target_ids', $employee->department_id);
                  })
                  ->orWhere(function ($q2) use ($employee) {
                      $q2->where('targeting_type', 'employee')
                         ->whereJsonContains('target_ids', $employee->id);
                  });
            })
            ->orderByDesc('published_at')
            ->get(['id', 'title', 'type', 'short_description', 'is_featured', 'published_at', 'start_date', 'end_date']);

        return response()->json($announcements);
    }

    /**
     * Get unread featured announcements for popup on app open.
     */
    public function featured(Request $request)
    {
        $employee = $this->resolveEmployee($request);
        if (!$employee) return response()->json(['message' => 'Unauthorized'], 401);

        $viewedIds = AnnouncementView::where('employee_id', $employee->id)->pluck('announcement_id');

        $featured = Announcement::published()
            ->featured()
            ->whereNotIn('id', $viewedIds)
            ->where(function ($q) use ($employee) {
                $q->where('targeting_type', 'all')
                  ->orWhere(fn ($q2) => $q2->where('targeting_type', 'branch')->whereJsonContains('target_ids', $employee->branch_id))
                  ->orWhere(fn ($q2) => $q2->where('targeting_type', 'department')->whereJsonContains('target_ids', $employee->department_id))
                  ->orWhere(fn ($q2) => $q2->where('targeting_type', 'employee')->whereJsonContains('target_ids', $employee->id));
            })
            ->first();

        return response()->json($featured);
    }

    /**
     * Get a single announcement and record view.
     */
    public function show(Request $request, $id)
    {
        $employee = $this->resolveEmployee($request);
        if (!$employee) return response()->json(['message' => 'Unauthorized'], 401);

        $announcement = Announcement::published()->findOrFail($id);

        // Record view (once per employee per announcement)
        AnnouncementView::firstOrCreate(
            ['announcement_id' => $announcement->id, 'employee_id' => $employee->id],
            ['viewed_at' => now()]
        );

        return response()->json($announcement);
    }
}
