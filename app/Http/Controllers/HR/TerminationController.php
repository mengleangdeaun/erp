<?php

namespace App\Http\Controllers\HR;

use App\Http\Controllers\Controller;
use App\Models\HR\Termination;
use Illuminate\Http\Request;

class TerminationController extends Controller
{
    public function index()
    {
        $terminations = Termination::with('employee:id,full_name,employee_code,profile_image')
            ->latest()
            ->get();

        return response()->json($terminations);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'employee_id'               => 'required|exists:employees,id',
            'termination_type'          => 'required|string|max:100',
            'notice_date'               => 'nullable|date',
            'termination_date'          => 'required|date',
            'notice_period'             => 'nullable|integer|min:0',
            'reason'                    => 'nullable|string',
            'description'               => 'nullable|string',
            'document'                  => 'nullable|string',
            'status'                    => 'required|in:pending,approved,rejected',
            'exit_interview_conducted'  => 'boolean',
            'exit_interview_date'       => 'nullable|date',
            'exit_feedback'             => 'nullable|string',
        ]);

        $termination = Termination::create($validated);
        $termination->load('employee:id,full_name,employee_code,profile_image');

        return response()->json($termination, 201);
    }

    public function show(Termination $termination)
    {
        $termination->load('employee:id,full_name,employee_code,profile_image');
        return response()->json($termination);
    }

    public function update(Request $request, Termination $termination)
    {
        $validated = $request->validate([
            'employee_id'               => 'required|exists:employees,id',
            'termination_type'          => 'required|string|max:100',
            'notice_date'               => 'nullable|date',
            'termination_date'          => 'required|date',
            'notice_period'             => 'nullable|integer|min:0',
            'reason'                    => 'nullable|string',
            'description'               => 'nullable|string',
            'document'                  => 'nullable|string',
            'status'                    => 'required|in:pending,approved,rejected',
            'exit_interview_conducted'  => 'boolean',
            'exit_interview_date'       => 'nullable|date',
            'exit_feedback'             => 'nullable|string',
        ]);

        $termination->update($validated);
        $termination->load('employee:id,full_name,employee_code,profile_image');

        return response()->json($termination);
    }

    public function destroy(Termination $termination)
    {
        $termination->delete();
        return response()->json(null, 204);
    }
}
