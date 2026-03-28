<?php

namespace App\Http\Controllers\Inventory;

use App\Http\Controllers\Controller;
use App\Models\Inventory\InventoryLocation;
use Illuminate\Http\Request;

class LocationController extends Controller
{
    public function index()
    {
        return response()->json(InventoryLocation::orderBy('name')->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string',
            'description' => 'nullable|string',
            'address' => 'nullable|string',
            'is_active' => 'boolean',
            'is_primary' => 'boolean',
            'branch_id' => 'required|exists:branches,id'
        ]);

        if (!empty($validated['is_primary']) && $validated['is_primary']) {
            InventoryLocation::where('branch_id', $validated['branch_id'])
                ->update(['is_primary' => false]);
        }

        return response()->json(InventoryLocation::create($validated), 201);
    }

    public function show($id)
    {
        return response()->json(InventoryLocation::findOrFail($id));
    }

    public function update(Request $request, $id)
    {
        $location = InventoryLocation::findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|required|string',
            'description' => 'nullable|string',
            'address' => 'nullable|string',
            'is_active' => 'boolean',
            'is_primary' => 'boolean',
            'branch_id' => 'sometimes|required|exists:branches,id'
        ]);

        if (!empty($validated['is_primary']) && $validated['is_primary']) {
            $branchId = $validated['branch_id'] ?? $location->branch_id;
            InventoryLocation::where('branch_id', $branchId)
                ->where('id', '!=', $id)
                ->update(['is_primary' => false]);
        }

        $location->update($validated);
        return response()->json($location);
    }

    public function destroy($id)
    {
        InventoryLocation::findOrFail($id)->delete();
        return response()->json(['message' => 'Location deleted successfully']);
    }
}
