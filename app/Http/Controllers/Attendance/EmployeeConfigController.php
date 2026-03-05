<?php

namespace App\Http\Controllers\Attendance;

use App\Http\Controllers\Controller;
use App\Models\HR\Employee;
use Illuminate\Http\Request;

class EmployeeConfigController extends Controller
{
    public function index()
    {
        $employees = Employee::with([
            'branch:id,name',
            'department:id,name',
            'designation:id,name',
            'workingShift:id,name',
            'attendancePolicy:id,name',
            'lineManager:id,employee_id,full_name'
        ])
        ->latest()
        ->get();

        return response()->json($employees);
    }

    public function updateField(Request $request, Employee $employee)
    {
        $request->validate([
            'working_shift_id'     => 'nullable|exists:working_shifts,id',
            'attendance_policy_id' => 'nullable|exists:attendance_policies,id',
            'status'               => 'nullable|in:active,inactive,on_leave,terminated',
            'telegram_user_id'     => 'nullable|string|max:255',
        ]);

        $employee->update($request->only([
            'working_shift_id',
            'attendance_policy_id',
            'status',
            'telegram_user_id'
        ]));

        return response()->json($employee->load([
            'branch:id,name',
            'department:id,name',
            'designation:id,name',
            'workingShift:id,name',
            'attendancePolicy:id,name'
        ]));
    }
}
