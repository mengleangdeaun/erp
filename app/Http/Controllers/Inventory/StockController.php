<?php

namespace App\Http\Controllers\Inventory;

use App\Http\Controllers\Controller;
use App\Models\Inventory\InventoryStock;
use Illuminate\Http\Request;

class StockController extends Controller
{
    public function index()
    {
        return response()->json(InventoryStock::with(['product', 'location'])->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'product_id' => 'required|exists:inventory_products,id',
            'location_id' => 'required|exists:inventory_locations,id',
            'quantity' => 'required|numeric'
        ]);

        // Upsert logic for stock addition
        $stock = InventoryStock::updateOrCreate(
            ['product_id' => $validated['product_id'], 'location_id' => $validated['location_id']],
            ['quantity' => \DB::raw("quantity + " . $validated['quantity'])]
        );

        // Fetch fresh object to hydrate the raw computation
        $stock = InventoryStock::find($stock->id);

        return response()->json($stock->load(['product', 'location']), 201);
    }

    public function adjust(Request $request, $id)
    {
        $stock = InventoryStock::findOrFail($id);
        
        $validated = $request->validate([
            'quantity' => 'required|numeric' // Explicit hard set of quantity
        ]);

        $stock->update(['quantity' => $validated['quantity']]);
        return response()->json($stock->load(['product', 'location']));
    }
}
