<?php

namespace App\Http\Controllers\Inventory;

use App\Http\Controllers\Controller;
use App\Models\Inventory\InventoryStockAdjustment;
use App\Models\Inventory\InventoryStockAdjustmentItem;
use App\Services\Inventory\StockService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;

class StockAdjustmentController extends Controller
{
    private $stockService;

    public function __construct(StockService $stockService)
    {
        $this->stockService = $stockService;
    }

    public function index(Request $request)
    {
        $query = InventoryStockAdjustment::with(['user', 'approvedBy', 'rejectedBy', 'items' => function($q) {
            $q->with(['product', 'location']);
        }])->orderBy('date', 'desc')->orderBy('created_at', 'desc');

        if ($request->has('search')) {
            $search = $request->search;
            $query->where('adjustment_no', 'like', "%{$search}%")
                  ->orWhere('notes', 'like', "%{$search}%");
        }

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        return response()->json($query->paginate($request->get('limit', 20)));
    }

    public function store(Request $request, \App\Services\DocumentNumberService $documentNumberService)
    {
        $validated = $request->validate([
            'date' => 'required|date',
            'notes' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:inventory_products,id',
            'items.*.location_id' => 'required|exists:inventory_locations,id',
            'items.*.current_qty' => 'required|numeric',
            'items.*.adjustment_qty' => 'required|numeric',
            'items.*.new_qty' => 'required|numeric',
            'items.*.reason' => 'required|string',
            'status' => 'nullable|string|in:DRAFT,PENDING',
        ]);

        return DB::transaction(function() use ($validated, $documentNumberService) {
            // Generate Adjustment No
            $adjustmentNo = $documentNumberService->generate('stock_adjustment');

            $adjustment = InventoryStockAdjustment::create([
                'adjustment_no' => $adjustmentNo,
                'date' => $validated['date'],
                'user_id' => Auth::id(),
                'notes' => $validated['notes'],
                'status' => $validated['status'] ?? 'DRAFT',
            ]);

            foreach ($validated['items'] as $itemData) {
                $adjustment->items()->create($itemData);
            }

            return response()->json($adjustment->load('items.product', 'items.location'), 201);
        });
    }

    public function update(Request $request, $id)
    {
        $adjustment = InventoryStockAdjustment::findOrFail($id);

        if (in_array($adjustment->status, ['APPROVED', 'COMPLETED'])) {
            return response()->json(['message' => 'Cannot update an approved/completed adjustment'], 422);
        }

        $validated = $request->validate([
            'date' => 'sometimes|required|date',
            'notes' => 'nullable|string',
            'items' => 'sometimes|required|array|min:1',
            'items.*.product_id' => 'required|exists:inventory_products,id',
            'items.*.location_id' => 'required|exists:inventory_locations,id',
            'items.*.current_qty' => 'required|numeric',
            'items.*.adjustment_qty' => 'required|numeric',
            'items.*.new_qty' => 'required|numeric',
            'items.*.reason' => 'required|string',
            'status' => 'nullable|string|in:DRAFT,PENDING',
        ]);

        return DB::transaction(function() use ($adjustment, $validated) {
            $adjustment->update($validated);

            if (isset($validated['items'])) {
                $adjustment->items()->delete();
                foreach ($validated['items'] as $itemData) {
                    $adjustment->items()->create($itemData);
                }
            }

            return response()->json($adjustment->load('items.product', 'items.location'));
        });
    }

    public function approve($id)
    {
        $adjustment = InventoryStockAdjustment::with('items')->findOrFail($id);

        if ($adjustment->status !== 'PENDING') {
            return response()->json(['message' => 'Only pending adjustments can be approved'], 422);
        }

        return DB::transaction(function() use ($adjustment) {
            foreach ($adjustment->items as $item) {
                // Use the reason from dropdown as movement type
                $type = $item->reason ?: ($item->adjustment_qty > 0 ? 'ADJUSTMENT_FOUND' : 'ADJUSTMENT_DAMAGE');
                
                $this->stockService->updateStock(
                    $item->product_id,
                    $item->location_id,
                    (float) $item->adjustment_qty,
                    $type,
                    $adjustment,
                    $adjustment->notes // use overall notes as movement reason/notes
                );
            }

            $adjustment->update([
                'status' => 'APPROVED',
                'approved_by_id' => Auth::id(),
                'approved_at' => now(),
            ]);

            return response()->json($adjustment->load('items.product', 'items.location', 'approvedBy'));
        });
    }

    public function reject(Request $request, $id)
    {
        $adjustment = InventoryStockAdjustment::findOrFail($id);

        if ($adjustment->status !== 'PENDING') {
            return response()->json(['message' => 'Only pending adjustments can be rejected'], 422);
        }

        $request->validate(['reason' => 'required|string']);

        $adjustment->update([
            'status' => 'REJECTED',
            'rejected_by_id' => Auth::id(),
            'rejected_at' => now(),
            'rejected_reason' => $request->reason,
        ]);

        return response()->json($adjustment->load('items.product', 'items.location', 'rejectedBy'));
    }

    public function show($id)
    {
        $adjustment = InventoryStockAdjustment::with(['user', 'approvedBy', 'rejectedBy', 'items.product', 'items.location'])->findOrFail($id);
        return response()->json($adjustment);
    }

    public function destroy($id)
    {
        $adjustment = InventoryStockAdjustment::findOrFail($id);

        if (in_array($adjustment->status, ['APPROVED', 'COMPLETED'])) {
            return response()->json(['message' => 'Cannot delete an approved/completed adjustment'], 422);
        }

        $adjustment->delete();
        return response()->json(['message' => 'Adjustment deleted successfully']);
    }
}
