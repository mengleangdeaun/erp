<?php

namespace App\Http\Controllers\HR;

use App\Http\Controllers\Controller;
use App\Models\HR\Holiday;
use Illuminate\Http\Request;

class HolidayController extends Controller
{
    public function index()
    {
        return response()->json(
            Holiday::with('branches:id,name')->latest()->get()
        );
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name'        => 'required|string|max:255',
            'category'    => 'required|string|max:100',
            'start_date'  => 'required|date',
            'end_date'    => 'required|date|after_or_equal:start_date',
            'description' => 'nullable|string',
            'is_paid'     => 'boolean',
            'is_half_day' => 'boolean',
            'branch_ids'  => 'required|array',
            'branch_ids.*' => 'exists:branches,id',
        ]);

        $holiday = Holiday::create($validated);
        
        if ($request->has('branch_ids')) {
            $holiday->branches()->sync($request->branch_ids);
        }

        return response()->json($holiday->load('branches:id,name'), 201);
    }

    public function show(Holiday $holiday)
    {
        return response()->json($holiday->load('branches:id,name'));
    }

    public function update(Request $request, Holiday $holiday)
    {
        $validated = $request->validate([
            'name'        => 'required|string|max:255',
            'category'    => 'required|string|max:100',
            'start_date'  => 'required|date',
            'end_date'    => 'required|date|after_or_equal:start_date',
            'description' => 'nullable|string',
            'is_paid'     => 'boolean',
            'is_half_day' => 'boolean',
            'branch_ids'  => 'required|array',
            'branch_ids.*' => 'exists:branches,id',
        ]);

        $holiday->update($validated);

        if ($request->has('branch_ids')) {
            $holiday->branches()->sync($request->branch_ids);
        }

        return response()->json($holiday->load('branches:id,name'));
    }

    public function destroy(Holiday $holiday)
    {
        $holiday->branches()->detach();
        $holiday->delete();
        return response()->json(null, 204);
    }
}
