<?php

namespace App\Http\Controllers\Inventory;

use App\Http\Controllers\Controller;
use App\Models\Inventory\InventorySerialMovement;
use Illuminate\Http\Request;

class SerialMovementController extends Controller
{
    public function index(Request $request)
    {
        $query = InventorySerialMovement::with(['product', 'location', 'user', 'serial', 'product.category', 'product.baseUom']);
        
        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->whereHas('product', function($pq) use ($search) {
                    $pq->where('name', 'like', "%{$search}%")
                       ->orWhere('code', 'like', "%{$search}%");
                })->orWhereHas('serial', function($sq) use ($search) {
                    $sq->where('serial_number', 'like', "%{$search}%");
                })->orWhere('reason', 'like', "%{$search}%");
            });
        }

        if ($request->has('serial_id')) {
            $query->where('serial_id', $request->serial_id);
        }

        if ($request->has('product_id')) {
            $query->where('product_id', $request->product_id);
        }

        if ($request->has('location_id')) {
            $query->where('location_id', $request->location_id);
        }

        if ($request->has('movement_type')) {
            $query->where('movement_type', $request->movement_type);
        }

        if ($request->has('start_date')) {
            $query->whereDate('created_at', '>=', $request->start_date);
        }

        if ($request->has('end_date')) {
            $query->whereDate('created_at', '<=', $request->end_date);
        }

        $movements = $query->orderBy('created_at', 'desc')->get();

        return response()->json($movements);
    }

    public function show($id)
    {
        $movement = InventorySerialMovement::with(['product', 'location', 'user', 'serial', 'reference'])->findOrFail($id);
        return response()->json($movement);
    }
}
