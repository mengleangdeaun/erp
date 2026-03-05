<?php

namespace App\Http\Controllers\HR;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class AwardTypeController extends Controller
{
    public function index(Request $request)
    {
        if ($request->query('compact')) {
            return response()->json(\App\Models\HR\AwardType::select('id', 'name')->where('status', 'active')->latest()->get());
        }
        return response()->json(\App\Models\HR\AwardType::latest()->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'status' => 'required|in:active,inactive',
            'description' => 'nullable|string',
        ]);

        $awardType = \App\Models\HR\AwardType::create($validated);
        return response()->json($awardType, 201);
    }

    public function show(\App\Models\HR\AwardType $awardType)
    {
        return response()->json($awardType);
    }

    public function update(Request $request, \App\Models\HR\AwardType $awardType)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'status' => 'required|in:active,inactive',
            'description' => 'nullable|string',
        ]);

        $awardType->update($validated);
        return response()->json($awardType);
    }

    public function destroy(\App\Models\HR\AwardType $awardType)
    {
        $awardType->delete();
        return response()->json(null, 204);
    }
}
