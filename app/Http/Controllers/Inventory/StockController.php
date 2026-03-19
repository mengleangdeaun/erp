<?php

namespace App\Http\Controllers\Inventory;

use App\Http\Controllers\Controller;
use App\Models\Inventory\InventoryStock;
use Illuminate\Http\Request;

class StockController extends Controller
{
    public function index(Request $request)
    {
        $query = InventoryStock::with(['product', 'location']);

        if ($request->has('product_id')) {
            $query->where('product_id', $request->product_id);
        }

        if ($request->has('location_id')) {
            $query->where('location_id', $request->location_id);
        }

        if ($request->has('search')) {
            $search = $request->search;
            $query->whereHas('product', function($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('code', 'like', "%{$search}%");
            });
        }

        return response()->json($query->get());
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
