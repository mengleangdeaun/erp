<?php

namespace App\Http\Controllers\HR;

use App\Http\Controllers\Controller;
use App\Models\HR\Warning;
use Illuminate\Http\Request;

class WarningController extends Controller
{
    public function index()
    {
        return response()->json(
            Warning::with('employee:id,full_name,employee_code,profile_image')->latest()->get()
        );
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'employee_id'          => 'required|exists:employees,id',
            'warning_by'           => 'required|string|max:150',
            'warning_type'         => 'required|string|max:100',
            'subject'              => 'required|string|max:255',
            'severity'             => 'required|in:low,medium,high',
            'warning_date'         => 'required|date',
            'description'          => 'nullable|string',
            'document'             => 'nullable|string',
            'expiry_date'          => 'nullable|date',
            'has_improvement_plan' => 'boolean',
            'ip_goal'              => 'nullable|string',
            'ip_start_date'        => 'nullable|date',
            'ip_end_date'          => 'nullable|date',
        ]);

        $warning = Warning::create($validated);
        $warning->load('employee:id,full_name,employee_code,profile_image');

        return response()->json($warning, 201);
    }

    public function show(Warning $warning)
    {
        $warning->load('employee:id,full_name,employee_code,profile_image');
        return response()->json($warning);
    }

    public function update(Request $request, Warning $warning)
    {
        $validated = $request->validate([
            'employee_id'          => 'required|exists:employees,id',
            'warning_by'           => 'required|string|max:150',
            'warning_type'         => 'required|string|max:100',
            'subject'              => 'required|string|max:255',
            'severity'             => 'required|in:low,medium,high',
            'warning_date'         => 'required|date',
            'description'          => 'nullable|string',
            'document'             => 'nullable|string',
            'expiry_date'          => 'nullable|date',
            'has_improvement_plan' => 'boolean',
            'ip_goal'              => 'nullable|string',
            'ip_start_date'        => 'nullable|date',
            'ip_end_date'          => 'nullable|date',
        ]);

        $warning->update($validated);
        $warning->load('employee:id,full_name,employee_code,profile_image');

        return response()->json($warning);
    }

    public function destroy(Warning $warning)
    {
        $warning->delete();
        return response()->json(null, 204);
    }
}
