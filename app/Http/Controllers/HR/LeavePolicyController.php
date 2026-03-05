<?php

namespace App\Http\Controllers\HR;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class LeavePolicyController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $leavePolicies = \App\Models\LeavePolicy::with('leaveType')->orderBy('name')->get();
        return response()->json($leavePolicies);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(\App\Http\Requests\HR\StoreLeavePolicyRequest $request)
    {
        $leavePolicy = \App\Models\LeavePolicy::create($request->validated());
        return response()->json($leavePolicy->load('leaveType'), 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(\App\Models\LeavePolicy $leavePolicy)
    {
        return response()->json($leavePolicy->load('leaveType'));
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(\App\Http\Requests\HR\UpdateLeavePolicyRequest $request, \App\Models\LeavePolicy $leavePolicy)
    {
        $leavePolicy->update($request->validated());
        return response()->json($leavePolicy->load('leaveType'));
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(\App\Models\LeavePolicy $leavePolicy)
    {
        $leavePolicy->delete();
        return response()->json(null, 204);
    }
}
