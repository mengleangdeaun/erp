<?php

namespace App\Http\Controllers\EmployeeApp;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\HR\Employee;
use App\Models\HR\Holiday;
use App\Models\Attendance\AttendanceRecord;
use App\Models\LeaveRequest;
use Carbon\Carbon;

class EmployeeAppController extends Controller
{
    /**
     * Helper to authenticate the device token passively without Laravel Sanctum overhead for the minimal PWA.
     */
    private function getAuthenticatedEmployee(Request $request)
    {
        $token = $request->header('Authorization') ?? $request->bearerToken();
        if (!$token) return null;

        // The frontend will send the raw token or 'Bearer token'
        $token = str_replace('Bearer ', '', $token);
        
        return Employee::where('auth_token', $token)->first();
    }

    /**
     * Dashboard: Get today's attendance status and basic stats.
     */
    public function dashboard(Request $request)
    {
        $employee = $this->getAuthenticatedEmployee($request);
        if (!$employee) return response()->json(['message' => 'Unauthorized Device'], 401);

        $today = Carbon::today()->toDateString();
        $record = AttendanceRecord::where('employee_id', $employee->id)
                    ->whereDate('date', $today)
                    ->first();

        // Calculate some basic stats (Optional, e.g. weekly hours)
        $startOfWeek = Carbon::now()->startOfWeek()->toDateString();
        $weeklyRecords = AttendanceRecord::where('employee_id', $employee->id)
                            ->whereBetween('date', [$startOfWeek, $today])
                            ->get();
        
        $daysPresentThisWeek = $weeklyRecords->count();

        return response()->json([
            'employee' => [
                'name' => $employee->full_name ?? $employee->employee_id,
                'designation' => $employee->designation->name ?? 'Staff',
                'branch' => $employee->branch->name ?? 'HQ',
                'profile_image' => $employee->profile_image
            ],
            'today_status' => $record ? $record->status : 'Not Clocked In',
            'clock_in_time' => $record ? $record->clock_in_time : null,
            'clock_out_time' => $record ? $record->clock_out_time : null,
            'days_present_this_week' => $daysPresentThisWeek,
        ]);
    }

    /**
     * History: Get a paginated list of past attendance records for the timeline view.
     */
    public function history(Request $request)
    {
        $employee = $this->getAuthenticatedEmployee($request);
        if (!$employee) return response()->json(['message' => 'Unauthorized Device'], 401);

        $records = AttendanceRecord::where('employee_id', $employee->id)
                    ->orderBy('date', 'desc')
                    ->paginate(15);

        return response()->json($records);
    }

    /**
     * Profile: Get read-only HR profile data for the settings tab.
     */
    public function profile(Request $request)
    {
        $employee = $this->getAuthenticatedEmployee($request);
        if (!$employee) return response()->json(['message' => 'Unauthorized Device'], 401);

        $employee->load(['department', 'designation', 'branch', 'workingShift']);

        // Calculate working period
        $joinDate = $employee->date_of_joining ? Carbon::parse($employee->date_of_joining) : null;
        $workingPeriod = null;
        if ($joinDate) {
            $diff = $joinDate->diff(Carbon::now());
            $parts = [];
            if ($diff->y > 0) $parts[] = $diff->y . ' yr' . ($diff->y > 1 ? 's' : '');
            if ($diff->m > 0) $parts[] = $diff->m . ' mo' . ($diff->m > 1 ? 's' : '');
            $workingPeriod = implode(' ', $parts) ?: '< 1 month';
        }

        // Working shift sessions
        $shift = $employee->workingShift;
        $shiftSessions = [];
        if ($shift) {
            if ($shift->type === 'split') {
                if ($shift->session1_start && $shift->session1_end)
                    $shiftSessions[] = ['label' => 'Session 1', 'start' => $shift->session1_start, 'end' => $shift->session1_end];
                if ($shift->session2_start && $shift->session2_end)
                    $shiftSessions[] = ['label' => 'Session 2', 'start' => $shift->session2_start, 'end' => $shift->session2_end];
            } else {
                if ($shift->start_time && $shift->end_time)
                    $shiftSessions[] = ['label' => 'Working Hours', 'start' => $shift->start_time, 'end' => $shift->end_time];
            }
        }

        return response()->json([
            'employee_id'     => $employee->employee_id,
            'full_name'       => $employee->full_name,
            'gender'          => $employee->gender,
            'email'           => $employee->email,
            'phone'           => $employee->phone,
            'address'         => trim(implode(', ', array_filter([$employee->address_line_1, $employee->address_line_2]))),
            'date_of_birth'   => $employee->date_of_birth,
            'date_of_joining' => $employee->date_of_joining,
            'working_period'  => $workingPeriod,
            'department'      => $employee->department->name ?? 'N/A',
            'designation'     => $employee->designation->name ?? 'N/A',
            'branch'          => $employee->branch->name ?? 'N/A',
            'shift_name'      => $shift->name ?? 'Standard',
            'shift_type'      => $shift->type ?? 'continuous',
            'shift_sessions'  => $shiftSessions,
            'profile_image'   => $employee->profile_image,
        ]);
    }

    /**
     * Update profile avatar/picture.
     */
    public function updateAvatar(Request $request)
    {
        $employee = $this->getAuthenticatedEmployee($request);
        if (!$employee) return response()->json(['message' => 'Unauthorized Device'], 401);

        $request->validate(['avatar' => 'required|image|max:2048']);

        $path = $request->file('avatar')->store('avatars', 'public');
        $employee->update(['profile_image' => $path]);

        return response()->json([
            'message' => 'Profile picture updated',
            'profile_image' => $path,
        ]);
    }

    /**
     * Get employee preferences (creates defaults if none exist).
     */
    public function getPreferences(Request $request)
    {
        $employee = $this->getAuthenticatedEmployee($request);
        if (!$employee) return response()->json(['message' => 'Unauthorized Device'], 401);

        $prefs = \App\Models\EmpPreference::firstOrCreate(
            ['employee_id' => $employee->id],
            [
                'font_family' => 'Inter',
                'font_size' => 'medium',
                'color_theme' => 'default',
                'dark_mode' => false,
                'notifications_enabled' => true,
            ]
        );

        return response()->json($prefs);
    }

    /**
     * Update employee preferences.
     */
    public function updatePreferences(Request $request)
    {
        $employee = $this->getAuthenticatedEmployee($request);
        if (!$employee) return response()->json(['message' => 'Unauthorized Device'], 401);

        $validated = $request->validate([
            'font_family'           => 'sometimes|string|max:50',
            'font_size'             => 'sometimes|in:small,medium,large',
            'color_theme'           => 'sometimes|string|max:30',
            'dark_mode'             => 'sometimes|boolean',
            'notifications_enabled' => 'sometimes|boolean',
        ]);

        $prefs = \App\Models\EmpPreference::updateOrCreate(
            ['employee_id' => $employee->id],
            $validated
        );

        return response()->json(['message' => 'Preferences saved', 'preferences' => $prefs]);
    }

    /**
     * Calendar: Get attendance, holidays, and leaves for a specific month.
     */
    public function calendarData(Request $request)
    {
        $employee = $this->getAuthenticatedEmployee($request);
        if (!$employee) return response()->json(['message' => 'Unauthorized Device'], 401);

        $month = $request->get('month', Carbon::now()->month);
        $year = $request->get('year', Carbon::now()->year);

        $startDate = Carbon::createFromDate($year, $month, 1)->startOfMonth();
        $endDate = Carbon::createFromDate($year, $month, 1)->endOfMonth();

        // 1. Attendance Records
        $attendance = AttendanceRecord::where('employee_id', $employee->id)
                        ->whereBetween('date', [$startDate, $endDate])
                        ->get();

        // 2. Holidays (Applicable to employee's branch)
        $branchId = $employee->branch_id;
        $holidays = Holiday::whereHas('branches', function($q) use ($branchId) {
                        $q->where('branches.id', $branchId);
                    })
                    ->where(function($q) use ($startDate, $endDate) {
                        $q->whereBetween('start_date', [$startDate, $endDate])
                          ->orWhereBetween('end_date', [$startDate, $endDate])
                          ->orWhere(function($sq) use ($startDate, $endDate) {
                              $sq->where('start_date', '<=', $startDate)
                                 ->where('end_date', '>=', $endDate);
                          });
                    })
                    ->get();

        // 3. Leave Requests
        $leaves = LeaveRequest::where('employee_id', $employee->id)
                    ->whereIn('status', ['approved', 'pending'])
                    ->where(function($q) use ($startDate, $endDate) {
                        $q->whereBetween('start_date', [$startDate, $endDate])
                          ->orWhereBetween('end_date', [$startDate, $endDate]);
                    })
                    ->with('leaveType')
                    ->get();

        // 4. Working Shift Info
        $employee->load('workingShift');

        return response()->json([
            'attendance' => $attendance,
            'holidays' => $holidays,
            'leaves' => $leaves,
            'working_days' => $employee->workingShift?->working_days ?? [],
            'working_shift' => $employee->workingShift
        ]);
    }
}
