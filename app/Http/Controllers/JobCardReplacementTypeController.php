<?php

namespace App\Http\Controllers;

use App\Models\JobCardReplacementType;
use Illuminate\Http\Request;

class JobCardReplacementTypeController extends Controller
{
    public function index()
    {
        return JobCardReplacementType::all();
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'status' => 'required|in:active,inactive'
        ]);

        return JobCardReplacementType::create($validated);
    }

    public function update(Request $request, $id)
    {
        $type = JobCardReplacementType::findOrFail($id);
        
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'status' => 'sometimes|in:active,inactive'
        ]);

        $type->update($validated);
        return $type;
    }

    public function destroy($id)
    {
        $type = JobCardReplacementType::findOrFail($id);
        $type->delete();
        return response()->json(['message' => 'Deleted successfully']);
    }
}
