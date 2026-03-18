<?php

namespace App\Http\Controllers\Inventory;

use App\Http\Controllers\Controller;
use App\Models\Inventory\InventoryTag;
use Illuminate\Http\Request;

class TagController extends Controller
{
    public function index()
    {
        return response()->json(InventoryTag::orderBy('name')->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|unique:inventory_tags,name',
            'color' => 'nullable|string',
            'is_active' => 'boolean'
        ]);

        return response()->json(InventoryTag::create($validated), 201);
    }

    public function show($id)
    {
        return response()->json(InventoryTag::findOrFail($id));
    }

    public function update(Request $request, $id)
    {
        $tag = InventoryTag::findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|required|string|unique:inventory_tags,name,' . $tag->id,
            'color' => 'nullable|string',
            'is_active' => 'boolean'
        ]);

        $tag->update($validated);
        return response()->json($tag);
    }

    public function destroy($id)
    {
        InventoryTag::findOrFail($id)->delete();
        return response()->json(['message' => 'Tag deleted successfully']);
    }
}
