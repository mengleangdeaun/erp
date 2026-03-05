<?php

namespace App\Http\Controllers\Attendance;

use App\Http\Controllers\Controller;
use App\Models\Attendance\WorkingShift;
use Illuminate\Http\Request;

class WorkingShiftController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        if ($request->query('compact')) {
            return response()->json(WorkingShift::select('id', 'name')->where('status', 'active')->latest()->get());
        }
        $workingShifts = WorkingShift::latest()->get();
        return response()->json($workingShifts);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $request->validate([
            'name'                               => 'required|string|max:255',
            'shift_type'                         => 'required|in:continuous,split',
            'working_days'                       => 'required|array|size:7',
            'working_days.*.is_working'          => 'required|boolean',
            'working_days.*.start_time'          => 'nullable|required_if:working_days.*.is_working,true|date_format:H:i',
            'working_days.*.end_time'            => 'nullable|required_if:working_days.*.is_working,true|date_format:H:i|after:working_days.*.start_time',
            'working_days.*.has_break'           => 'required|boolean',
            'working_days.*.break_start'         => 'nullable|required_if:working_days.*.has_break,true|date_format:H:i|after:working_days.*.start_time|before:working_days.*.end_time',
            'working_days.*.break_end'           => 'nullable|required_if:working_days.*.has_break,true|date_format:H:i|after:working_days.*.break_start|before:working_days.*.end_time',
            'status'                             => 'required|in:active,inactive',
            'description'                        => 'nullable|string',
        ]);

        $workingShift = WorkingShift::create($request->all());

        return response()->json($workingShift, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(WorkingShift $workingShift)
    {
        return response()->json($workingShift);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, WorkingShift $workingShift)
    {
        $request->validate([
            'name'                               => 'required|string|max:255',
            'shift_type'                         => 'required|in:continuous,split',
            'working_days'                       => 'required|array|size:7',
            'working_days.*.is_working'          => 'required|boolean',
            'working_days.*.start_time'          => 'nullable|required_if:working_days.*.is_working,true|date_format:H:i',
            'working_days.*.end_time'            => 'nullable|required_if:working_days.*.is_working,true|date_format:H:i|after:working_days.*.start_time',
            'working_days.*.has_break'           => 'required|boolean',
            'working_days.*.break_start'         => 'nullable|required_if:working_days.*.has_break,true|date_format:H:i|after:working_days.*.start_time|before:working_days.*.end_time',
            'working_days.*.break_end'           => 'nullable|required_if:working_days.*.has_break,true|date_format:H:i|after:working_days.*.break_start|before:working_days.*.end_time',
            'status'                             => 'required|in:active,inactive',
            'description'                        => 'nullable|string',
        ]);

        $workingShift->update($request->all());

        return response()->json($workingShift);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(WorkingShift $workingShift)
    {
        $workingShift->delete();
        return response()->json(null, 204);
    }
}
