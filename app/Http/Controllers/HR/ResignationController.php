<?php

namespace App\Http\Controllers\HR;

use App\Http\Controllers\Controller;
use App\Models\HR\Resignation;
use Illuminate\Http\Request;

class ResignationController extends Controller
{
    public function index()
    {
        $resignations = Resignation::with('employee:id,full_name,employee_code,profile_image,designation_id')
            ->latest()
            ->get();

        return response()->json($resignations);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'employee_id'               => 'required|exists:employees,id',
            'resignation_date'          => 'required|date',
            'last_working_day'          => 'required|date|after_or_equal:resignation_date',
            'notice_period'             => 'nullable|integer|min:0',
            'reason'                    => 'nullable|string',
            'description'               => 'nullable|string',
            'document'                  => 'nullable|string',
            'status'                    => 'required|in:pending,approved,rejected',
            'exit_interview_conducted'  => 'boolean',
            'exit_interview_date'       => 'nullable|date',
            'exit_feedback'             => 'nullable|string',
        ]);

        $resignation = Resignation::create($validated);
        $resignation->load('employee:id,full_name,employee_code,profile_image');

        return response()->json($resignation, 201);
    }

    public function show(Resignation $resignation)
    {
        $resignation->load('employee:id,full_name,employee_code,profile_image');
        return response()->json($resignation);
    }

    public function update(Request $request, Resignation $resignation)
    {
        $validated = $request->validate([
            'employee_id'               => 'required|exists:employees,id',
            'resignation_date'          => 'required|date',
            'last_working_day'          => 'required|date|after_or_equal:resignation_date',
            'notice_period'             => 'nullable|integer|min:0',
            'reason'                    => 'nullable|string',
            'description'               => 'nullable|string',
            'document'                  => 'nullable|string',
            'status'                    => 'required|in:pending,approved,rejected',
            'exit_interview_conducted'  => 'boolean',
            'exit_interview_date'       => 'nullable|date',
            'exit_feedback'             => 'nullable|string',
        ]);

        $resignation->update($validated);
        $resignation->load('employee:id,full_name,employee_code,profile_image');

        return response()->json($resignation);
    }

    public function destroy(Resignation $resignation)
    {
        $resignation->delete();
        return response()->json(null, 204);
    }
}
