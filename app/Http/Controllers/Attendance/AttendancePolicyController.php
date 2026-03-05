<?php

namespace App\Http\Controllers\Attendance;

use App\Http\Controllers\Controller;
use App\Models\Attendance\AttendancePolicy;
use Illuminate\Http\Request;

class AttendancePolicyController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        if ($request->query('compact')) {
            return response()->json(AttendancePolicy::select('id', 'name')->where('status', 'active')->latest()->get());
        }
        $policies = AttendancePolicy::latest()->get();
        return response()->json($policies);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $request->validate([
            'name'                                  => 'required|string|max:255|unique:attendance_policies',
            'late_tolerance_minutes'                => 'nullable|integer|min:0',
            'early_departure_tolerance_minutes'     => 'nullable|integer|min:0',
            'overtime_minimum_minutes'              => 'nullable|integer|min:0',
            'status'                                => 'required|in:active,inactive',
            'description'                           => 'nullable|string',
        ]);

        $policy = AttendancePolicy::create($request->all());

        return response()->json($policy, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(AttendancePolicy $attendancePolicy)
    {
        return response()->json($attendancePolicy);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, AttendancePolicy $attendancePolicy)
    {
        $request->validate([
            'name'                                  => 'required|string|max:255|unique:attendance_policies,name,' . $attendancePolicy->id,
            'late_tolerance_minutes'                => 'nullable|integer|min:0',
            'early_departure_tolerance_minutes'     => 'nullable|integer|min:0',
            'overtime_minimum_minutes'              => 'nullable|integer|min:0',
            'status'                                => 'required|in:active,inactive',
            'description'                           => 'nullable|string',
        ]);

        $attendancePolicy->update($request->all());

        return response()->json($attendancePolicy);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(AttendancePolicy $attendancePolicy)
    {
        $attendancePolicy->delete();
        return response()->json(null, 204);
    }
}
