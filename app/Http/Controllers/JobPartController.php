<?php

namespace App\Http\Controllers;

use App\Models\JobPartMaster;
use Illuminate\Http\Request;

class JobPartController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        return JobPartMaster::orderBy('type')->orderBy('name')->get();
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'type' => 'required|string|max:10',
            'is_active' => 'boolean'
        ]);

        $part = JobPartMaster::create($validated);

        return response()->json($part, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(JobPartMaster $jobPart)
    {
        return $jobPart;
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, JobPartMaster $jobPart)
    {
        $validated = $request->validate([
            'name' => 'string|max:255',
            'type' => 'string|max:10',
            'is_active' => 'boolean'
        ]);

        $jobPart->update($validated);

        return response()->json($jobPart);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(JobPartMaster $jobPart)
    {
        $jobPart->delete();
        return response()->json(null, 204);
    }
}
