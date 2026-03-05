<?php

namespace App\Http\Controllers\HR;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class LeaveBalanceController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = \App\Models\LeaveBalance::with(['employee', 'leaveType']);
        
        if ($request->has('year')) {
            $query->where('year', $request->year);
        } elseif ($request->has('start_date') && $request->has('end_date')) {
            $startYear = \Illuminate\Support\Carbon::parse($request->start_date)->year;
            $endYear = \Illuminate\Support\Carbon::parse($request->end_date)->year;
            
            if ($startYear === $endYear) {
                $query->where('year', $startYear);
            } else {
                $query->whereBetween('year', [$startYear, $endYear]);
            }
        }

        if ($request->has('employee_id')) {
            $query->where('employee_id', $request->employee_id);
        }

        if ($request->has('leave_type_id')) {
            $query->where('leave_type_id', $request->leave_type_id);
        }

        $balances = $query->get();
        return response()->json($balances);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'employee_id' => 'required|exists:employees,id',
            'leave_type_id' => 'required|exists:leave_types,id',
            'total_accrued' => 'required|numeric|min:0',
            'total_taken' => 'required|numeric|min:0',
            'balance' => 'required|numeric|min:0',
            'year' => 'required|integer|min:1900',
        ]);

        $balance = \App\Models\LeaveBalance::create($validated);
        return response()->json($balance->load(['employee', 'leaveType']), 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(\App\Models\LeaveBalance $leaveBalance)
    {
        return response()->json($leaveBalance->load(['employee', 'leaveType']));
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, \App\Models\LeaveBalance $leaveBalance)
    {
        $validated = $request->validate([
            'employee_id' => 'required|exists:employees,id',
            'leave_type_id' => 'required|exists:leave_types,id',
            'total_accrued' => 'required|numeric|min:0',
            'total_taken' => 'required|numeric|min:0',
            'balance' => 'required|numeric|min:0',
            'year' => 'required|integer|min:1900',
        ]);

        $leaveBalance->update($validated);
        return response()->json($leaveBalance->load(['employee', 'leaveType']));
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(\App\Models\LeaveBalance $leaveBalance)
    {
        $leaveBalance->delete();
        return response()->json(null, 204);
    }
}
