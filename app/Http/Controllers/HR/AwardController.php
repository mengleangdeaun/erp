<?php

namespace App\Http\Controllers\HR;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class AwardController extends Controller
{
    public function index()
    {
        $awards = \App\Models\HR\Award::with(['employee:id,full_name,employee_code,profile_image', 'awardType:id,name'])->latest()->get();
        return response()->json($awards);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'employee_id' => 'required|exists:employees,id',
            'award_type_id' => 'required|exists:award_types,id',
            'date' => 'required|date',
            'gift' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'certificate' => 'nullable|string',
            'photo' => 'nullable|string',
        ]);

        $award = \App\Models\HR\Award::create($validated);
        $award->load(['employee:id,full_name,employee_code,profile_image', 'awardType:id,name']);
        
        return response()->json($award, 201);
    }

    public function show(\App\Models\HR\Award $award)
    {
        $award->load(['employee:id,full_name,employee_code,profile_image', 'awardType:id,name']);
        return response()->json($award);
    }

    public function update(Request $request, \App\Models\HR\Award $award)
    {
        $validated = $request->validate([
            'employee_id' => 'required|exists:employees,id',
            'award_type_id' => 'required|exists:award_types,id',
            'date' => 'required|date',
            'gift' => 'nullable|string|max:255',
            'description' => 'nullable|string',
            'certificate' => 'nullable|string',
            'photo' => 'nullable|string',
        ]);

        $award->update($validated);
        $award->load(['employee:id,full_name,employee_code,profile_image', 'awardType:id,name']);

        return response()->json($award);
    }

    public function destroy(\App\Models\HR\Award $award)
    {
        $award->delete();
        return response()->json(null, 204);
    }
}
