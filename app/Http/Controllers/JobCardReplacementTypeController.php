<?php

namespace App\Http\Controllers;

use App\Models\JobCardReplacementType;
use Illuminate\Http\Request;

class JobCardReplacementTypeController extends Controller
{
    public function index(Request $request)
    {
        $query = JobCardReplacementType::query();

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }

        if ($request->has('is_active')) {
            $query->where('is_active', filter_var($request->is_active, FILTER_VALIDATE_BOOLEAN));
        }

        if ($request->has('all') || $request->paginate === 'false') {
            return $query->get();
        }

        return $query->paginate($request->per_page ?? 15);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'is_active' => 'sometimes|boolean'
        ]);

        return JobCardReplacementType::create($validated);
    }

    public function update(Request $request, $id)
    {
        $type = JobCardReplacementType::findOrFail($id);
        
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'is_active' => 'sometimes|boolean'
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
