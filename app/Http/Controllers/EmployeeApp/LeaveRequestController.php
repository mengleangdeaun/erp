<?php

namespace App\Http\Controllers\EmployeeApp;

use App\Http\Controllers\Controller;
use App\Models\LeaveRequest;
use App\Models\LeaveBalance;
use App\Models\EmployeeLeaveAllocation;
use App\Models\HR\Employee;
use Illuminate\Http\Request;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class LeaveRequestController extends Controller
{
    /**
     * Helper to authenticate the device token passively without Laravel Sanctum overhead for the minimal PWA.
     */
    private function getAuthenticatedEmployee(Request $request)
    {
        $token = $request->header('Authorization') ?? $request->bearerToken();
        if (!$token) return null;
        $token = str_replace('Bearer ', '', $token);
        return Employee::where('auth_token', $token)->first();
    }

    /**
     * Display a listing of the resource for the authenticated employee.
     */
    public function index(Request $request)
    {
        $employee = $this->getAuthenticatedEmployee($request);
        if (!$employee) return response()->json(['message' => 'Unauthorized'], 401);

        $requests = LeaveRequest::with('leaveType')
            ->where('employee_id', $employee->id)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($requests);
    }

    /**
     * Store a newly created leave request in storage.
     */
    public function store(Request $request)
    {
        $employee = $this->getAuthenticatedEmployee($request);
        if (!$employee) return response()->json(['message' => 'Unauthorized'], 401);

        $validated = $request->validate([
            'leave_type_id' => 'required|exists:leave_types,id',
            'duration_type' => 'required|in:full_day,first_half,second_half,multi_day,custom_time',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'start_time' => 'nullable|date_format:H:i',
            'end_time' => 'nullable|date_format:H:i|after:start_time',
            'reason' => 'required|string',
        ]);

        try {
            DB::beginTransaction();

            // 1. Find the active leave policy allocation for this type
            $allocation = EmployeeLeaveAllocation::where('employee_id', $employee->id)
                ->where('is_active', true)
                ->whereHas('leavePolicy', function ($query) use ($validated) {
                    $query->where('leave_type_id', $validated['leave_type_id']);
                })->first();

            if (!$allocation) {
                return response()->json(['message' => 'No active leave policy found for this leave type.'], 422);
            }

            $policy = $allocation->leavePolicy;

            // 2. Calculate Total Days dynamically
            $totalDays = 0;
            $startDate = Carbon::parse($validated['start_date']);
            $endDate = Carbon::parse($validated['end_date']);

            if (in_array($validated['duration_type'], ['first_half', 'second_half'])) {
                $totalDays = 0.5;
                $validated['end_date'] = $validated['start_date']; // End date is same as start for half day
            } elseif ($validated['duration_type'] === 'full_day') {
                $totalDays = 1.0;
                $validated['end_date'] = $validated['start_date'];
            } elseif ($validated['duration_type'] === 'multi_day') {
                // Determine working days based on shift
                $shift = $employee->working_shift_id ? \App\Models\Attendance\WorkingShift::find($employee->working_shift_id) : null;
                $workingDaysArray = $shift && $shift->working_days ? $shift->working_days : ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
                
                $current = $startDate->copy();
                while ($current->lte($endDate)) {
                    if (in_array($current->englishDayOfWeek, $workingDaysArray)) {
                        $totalDays += 1;
                    }
                    $current->addDay();
                }
            } elseif ($validated['duration_type'] === 'custom_time') {
                // Simplification: treat custom time as less than a day based on hours. Assumes 8hr workday.
                if (!$validated['start_time'] || !$validated['end_time']) {
                    return response()->json(['message' => 'Start and End time are required for custom time.'], 422);
                }
                $start = Carbon::parse($validated['start_time']);
                $end = Carbon::parse($validated['end_time']);
                $hours = $start->diffInMinutes($end) / 60;
                $totalDays = min(1.0, round($hours / 8, 2));
                $validated['end_date'] = $validated['start_date'];
            }

            if ($totalDays <= 0) {
                return response()->json(['message' => 'Calculated duration is zero days (potentially falling on weekends/off-days).'], 422);
            }

            // 3. Validate against Policy Constraints
            if ($policy->min_days_per_app && $totalDays < $policy->min_days_per_app) {
                return response()->json(['message' => "Minimum {$policy->min_days_per_app} days required per application."], 422);
            }
            if ($policy->max_days_per_app && $totalDays > $policy->max_days_per_app) {
                return response()->json(['message' => "Maximum {$policy->max_days_per_app} days allowed per application."], 422);
            }

            // 4. Check available Leave Balance
            $currentYear = date('Y');
            $balance = LeaveBalance::where('employee_id', $employee->id)
                ->where('leave_type_id', $validated['leave_type_id'])
                ->where('year', $currentYear)
                ->first();

            if (!$balance || $balance->balance < $totalDays) {
                return response()->json(['message' => 'Insufficient leave balance.'], 422);
            }

            // 5. Check overlapping pending or approved requests
            $overlap = LeaveRequest::where('employee_id', $employee->id)
                ->whereIn('status', ['pending', 'approved'])
                ->where(function ($q) use ($validated) {
                    $q->whereBetween('start_date', [$validated['start_date'], $validated['end_date']])
                      ->orWhereBetween('end_date', [$validated['start_date'], $validated['end_date']])
                      ->orWhere(function ($q2) use ($validated) {
                          $q2->where('start_date', '<=', $validated['start_date'])
                             ->where('end_date', '>=', $validated['end_date']);
                      });
                })->exists();

            if ($overlap) {
                return response()->json(['message' => 'You already have a pending or approved request during these dates.'], 422);
            }

            // 6. Create Leave Request
            $status = $policy->require_approval ? 'pending' : 'approved';
            
            $leaveRequest = LeaveRequest::create([
                'employee_id' => $employee->id,
                'leave_type_id' => $validated['leave_type_id'],
                'duration_type' => $validated['duration_type'],
                'start_date' => $validated['start_date'],
                'end_date' => $validated['end_date'],
                'start_time' => $validated['start_time'] ?? null,
                'end_time' => $validated['end_time'] ?? null,
                'total_days' => $totalDays,
                'reason' => $validated['reason'],
                'status' => $status,
                'approved_by' => $allocation->approved_by, // Route for approval
            ]);

            // If auto-approved, deduct balance immediately
            if ($status === 'approved') {
                $balance->total_taken += $totalDays;
                $balance->balance -= $totalDays;
                $balance->save();
            }

            DB::commit();
            return response()->json($leaveRequest->load('leaveType'), 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Failed to submit leave request: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Cancel a pending leave request
     */
    public function cancel(Request $request, $id)
    {
        $employee = $this->getAuthenticatedEmployee($request);
        if (!$employee) return response()->json(['message' => 'Unauthorized'], 401);

        $leaveRequest = LeaveRequest::find($id);
        
        if (!$leaveRequest) {
            return response()->json(['message' => 'Leave request not found.'], 404);
        }

        if ($leaveRequest->employee_id !== $employee->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        if ($leaveRequest->status !== 'pending') {
            return response()->json(['message' => 'Only pending requests can be cancelled.'], 422);
        }

        $leaveRequest->status = 'cancelled';
        $leaveRequest->save();

        return response()->json($leaveRequest);
    }

    /**
     * Get pending approvals assigned to the authenticated employee.
     */
    public function approvals(Request $request)
    {
        $employee = $this->getAuthenticatedEmployee($request);
        if (!$employee) return response()->json(['message' => 'Unauthorized'], 401);

        $approvals = LeaveRequest::with(['leaveType', 'employee'])
            ->where('approved_by', $employee->id)
            ->where('status', 'pending')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($approvals);
    }

    /**
     * Approve a leave request.
     */
    public function approve(Request $request, $id)
    {
        $employee = $this->getAuthenticatedEmployee($request);
        if (!$employee) return response()->json(['message' => 'Unauthorized'], 401);

        try {
            DB::beginTransaction();

            $leaveRequest = LeaveRequest::find($id);
            if (!$leaveRequest) {
                return response()->json(['message' => 'Leave request not found.'], 404);
            }

            if ($leaveRequest->approved_by !== $employee->id) {
                return response()->json(['message' => 'You are not authorized to approve this request.'], 403);
            }

            if ($leaveRequest->status !== 'pending') {
                return response()->json(['message' => 'This request is no longer pending.'], 422);
            }

            // Deduct balance
            $currentYear = Carbon::parse($leaveRequest->start_date)->year;
            $balance = LeaveBalance::where('employee_id', $leaveRequest->employee_id)
                ->where('leave_type_id', $leaveRequest->leave_type_id)
                ->where('year', $currentYear)
                ->first();

            if (!$balance || $balance->balance < $leaveRequest->total_days) {
                return response()->json(['message' => 'Employee has insufficient leave balance.'], 422);
            }

            $balance->total_taken += $leaveRequest->total_days;
            $balance->balance -= $leaveRequest->total_days;
            $balance->save();

            $leaveRequest->status = 'approved';
            $leaveRequest->save();

            DB::commit();
            return response()->json($leaveRequest);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Approval failed: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Reject a leave request.
     */
    public function reject(Request $request, $id)
    {
        $employee = $this->getAuthenticatedEmployee($request);
        if (!$employee) return response()->json(['message' => 'Unauthorized'], 401);

        $validated = $request->validate([
            'rejection_reason' => 'required|string|max:500',
        ]);

        $leaveRequest = LeaveRequest::find($id);
        if (!$leaveRequest) {
            return response()->json(['message' => 'Leave request not found.'], 404);
        }

        if ($leaveRequest->approved_by !== $employee->id) {
            return response()->json(['message' => 'You are not authorized to reject this request.'], 403);
        }

        if ($leaveRequest->status !== 'pending') {
            return response()->json(['message' => 'This request is no longer pending.'], 422);
        }

        $leaveRequest->status = 'rejected';
        $leaveRequest->rejection_reason = $validated['rejection_reason'];
        $leaveRequest->save();

        return response()->json($leaveRequest);
    }
}
