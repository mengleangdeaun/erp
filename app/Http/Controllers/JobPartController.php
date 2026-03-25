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
        return JobPartMaster::orderBy('code')->orderBy('name')->get();
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'nullable|string|max:50|unique:job_parts_master,code',
            'type' => 'nullable|string|max:20',
            'side' => 'nullable|string|max:20',
            'is_active' => 'boolean'
        ]);

        $part = JobPartMaster::create($validated);

        return response()->json($part, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(JobPartMaster $part)
    {
        return $part;
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, JobPartMaster $part)
    {
        $validated = $request->validate([
            'name' => 'string|max:255',
            'code' => 'nullable|string|max:50|unique:job_parts_master,code,' . $part->id,
            'type' => 'nullable|string|max:20',
            'side' => 'nullable|string|max:20',
            'is_active' => 'boolean'
        ]);

        $part->update($validated);

        return response()->json($part);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(JobPartMaster $part)
    {
        $part->delete();
        return response()->json(null, 204);
    }
}
