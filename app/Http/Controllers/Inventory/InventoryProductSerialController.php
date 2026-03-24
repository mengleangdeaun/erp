<?php

namespace App\Http\Controllers\Inventory;

use App\Http\Controllers\Controller;
use App\Models\Inventory\InventoryProductSerial;
use Illuminate\Http\Request;
use App\Models\JobCardMaterialUsage;

class InventoryProductSerialController extends Controller
{
    public function index(Request $request)
    {
        $query = InventoryProductSerial::with(['product', 'branch', 'location']);

        if ($request->branch_id && $request->branch_id !== 'all') {
            $query->where('branch_id', $request->branch_id);
        }
        if ($request->location_id && $request->location_id !== 'all') {
            $query->where('location_id', $request->location_id);
        }
        if ($request->product_id && $request->product_id !== 'all') {
            $query->where('product_id', $request->product_id);
        }
        if ($request->status && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        if ($request->search) {
            $query->where('serial_number', 'like', '%' . $request->search . '%');
        }

        $sortBy = $request->sort_by ?? 'created_at';
        $sortDirection = $request->sort_direction ?? 'desc';

        // Map frontend sort keys to backend columns if necessary
        $sortColumn = $sortBy;
        if ($sortBy === 'product_id') {
            // Sorting by product name might require a join, but for now we'll just use product_id
            $sortColumn = 'product_id';
        }

        return $query->orderBy($sortColumn, $sortDirection)->paginate($request->per_page ?? 15);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'product_id' => 'required|exists:inventory_products,id',
            'serial_number' => 'required|string|unique:inventory_product_serials,serial_number',
            'length' => 'required|numeric',
            'width' => 'required|numeric',
            'branch_id' => 'required|exists:branches,id',
            'location_id' => 'required|exists:inventory_locations,id',
            'notes' => 'nullable|string',
        ]);

        // Calculate Area (sqm)
        $area = $validated['length'] * $validated['width'];
        $validated['initial_quantity'] = $area;
        $validated['current_quantity'] = $area;
        $validated['status'] = 'Available';

        $serial = InventoryProductSerial::create($validated);
        return $serial->load(['product', 'branch', 'location']);
    }

    public function update(Request $request, $id)
    {
        $serial = InventoryProductSerial::findOrFail($id);
        
        $validated = $request->validate([
            'current_quantity' => 'sometimes|numeric',
            'status' => 'sometimes|string',
            'notes' => 'nullable|string',
        ]);

        $serial->update($validated);
        return $serial->load(['product', 'branch']);
    }

    public function show($id)
    {
        return InventoryProductSerial::with(['product', 'branch'])->findOrFail($id);
    }

    public function destroy($id)
    {
        $serial = InventoryProductSerial::findOrFail($id);
        $serial->delete();
        return response()->json(['message' => 'Serial deleted successfully']);
    }

    public function history($id)
    {
        return JobCardMaterialUsage::with(['jobCard', 'jobCardItem', 'jobCard.customer', 'jobCard.vehicle'])
            ->where('serial_id', $id)
            ->latest()
            ->get();
    }
}
