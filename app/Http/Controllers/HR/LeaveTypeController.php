<?php

namespace App\Http\Controllers\HR;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class LeaveTypeController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $leaveTypes = \App\Models\LeaveType::orderBy('name')->get();
        return response()->json($leaveTypes);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(\App\Http\Requests\HR\StoreLeaveTypeRequest $request)
    {
        $leaveType = \App\Models\LeaveType::create($request->validated());
        return response()->json($leaveType, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(\App\Models\LeaveType $leaveType)
    {
        return response()->json($leaveType);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(\App\Http\Requests\HR\UpdateLeaveTypeRequest $request, \App\Models\LeaveType $leaveType)
    {
        $leaveType->update($request->validated());
        return response()->json($leaveType);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(\App\Models\LeaveType $leaveType)
    {
        $leaveType->delete();
        return response()->json(null, 204);
    }
}
