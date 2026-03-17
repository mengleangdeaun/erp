<?php

namespace App\Http\Controllers\HR;

use App\Http\Controllers\Controller;
use App\Models\EmployeeLeaveAllocation;
use App\Models\LeaveBalance;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class EmployeeLeaveAllocationController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $allocations = EmployeeLeaveAllocation::with(['employee', 'leavePolicy.leaveType', 'approver'])
            ->orderBy('id', 'desc')
            ->get();
            
        return response()->json($allocations);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'employee_ids' => 'required|array|min:1',
            'employee_ids.*' => 'exists:employees,id',
            'leave_policy_id' => 'required|exists:leave_policies,id',
            'effective_date' => 'required|date',
            'expiration_date' => 'nullable|date|after_or_equal:effective_date',
            'is_active' => 'boolean',
            'approved_by' => 'nullable|exists:employees,id',
        ]);

        try {
            DB::beginTransaction();

            \Log::info('Leave Allocation Payload:', $request->all());
            
            $policy = \App\Models\LeavePolicy::find($validated['leave_policy_id']);
            $currentYear = date('Y');
            
            $assignedCount = 0;
            $skippedCount = 0;

            foreach ($validated['employee_ids'] as $empId) {
                // Basic conflict check (skip if it already exists)
                $exists = EmployeeLeaveAllocation::where('employee_id', $empId)
                    ->where('leave_policy_id', $validated['leave_policy_id'])
                    ->where('is_active', true)
                    ->exists();
                    
                if ($exists) {
                    $skippedCount++;
                    continue;
                }

                $employee = \App\Models\HR\Employee::find($empId);
                $allocationData = [
                    'employee_id' => $empId,
                    'leave_policy_id' => $validated['leave_policy_id'],
                    'effective_date' => $validated['effective_date'],
                    'expiration_date' => $validated['expiration_date'] ?? null,
                    'is_active' => $validated['is_active'] ?? true,
                    'approved_by' => $validated['approved_by'] ?? ($employee ? $employee->line_manager_id : null),
                ];

                EmployeeLeaveAllocation::create($allocationData);
                
                // Auto generate leave balance for current year
                LeaveBalance::firstOrCreate([
                    'employee_id' => $empId,
                    'leave_type_id' => $policy->leave_type_id,
                    'year' => $currentYear,
                ], [
                    'total_accrued' => $policy->accrual_rate, // Simple generation based on fixed rate for starting.
                    'total_taken' => 0,
                    'balance' => $policy->accrual_rate,
                ]);

                $assignedCount++;
            }

            DB::commit();
            return response()->json([
                'message' => "Successfully assigned to $assignedCount employees. Skipped $skippedCount (already active).",
                'assigned_count' => $assignedCount,
                'skipped_count' => $skippedCount,
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Failed to allocate leave: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(EmployeeLeaveAllocation $employeeLeaveAllocation)
    {
        return response()->json($employeeLeaveAllocation->load(['employee', 'leavePolicy']));
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, EmployeeLeaveAllocation $employeeLeaveAllocation)
    {
        $validated = $request->validate([
            'effective_date' => 'required|date',
            'expiration_date' => 'nullable|date|after_or_equal:effective_date',
            'is_active' => 'boolean',
            'approved_by' => 'nullable|exists:employees,id',
        ]);

        \Log::info('Update Allocation Payload:', $request->all());
        \Log::info('Update Validated:', $validated);

        $employeeLeaveAllocation->update($validated);
        return response()->json($employeeLeaveAllocation->load(['employee', 'leavePolicy']));
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(EmployeeLeaveAllocation $employeeLeaveAllocation)
    {
        $employeeLeaveAllocation->delete();
        return response()->json(null, 204);
    }
}
