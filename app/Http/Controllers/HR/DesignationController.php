<?php

namespace App\Http\Controllers\HR;

use App\Http\Controllers\Controller;
use App\Models\HR\Designation;
use Illuminate\Http\Request;

class DesignationController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        if ($request->query('compact')) {
            return response()->json(Designation::with('departments:id,name')->select('id', 'name')->latest()->get());
        }
        $designations = Designation::with('departments.branches')->latest()->get();
        return response()->json($designations);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'department_ids' => 'required|array|min:1',
            'department_ids.*' => 'exists:departments,id',
            'description' => 'nullable|string',
            'status' => 'required|in:active,inactive',
        ]);

        $designation = Designation::create($request->except('department_ids'));
        $designation->departments()->sync($request->department_ids);

        return response()->json($designation->load('departments'), 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(Designation $designation)
    {
        return response()->json($designation->load('departments'));
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Designation $designation)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'department_ids' => 'required|array|min:1',
            'department_ids.*' => 'exists:departments,id',
            'description' => 'nullable|string',
            'status' => 'required|in:active,inactive',
        ]);

        $designation->update($request->except('department_ids'));
        $designation->departments()->sync($request->department_ids);

        return response()->json($designation->load('departments'));
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Designation $designation)
    {
        $designation->delete();
        return response()->json(null, 204);
    }
}
