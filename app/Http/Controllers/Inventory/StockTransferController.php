<?php

namespace App\Http\Controllers\Inventory;

use App\Http\Controllers\Controller;
use App\Models\Inventory\InventoryStockTransfer;
use App\Models\Inventory\InventoryStockTransferItem;
use App\Services\Inventory\StockService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;

class StockTransferController extends Controller
{
    private $stockService;

    public function __construct(StockService $stockService)
    {
        $this->stockService = $stockService;
    }

    public function index(Request $request)
    {
        $query = InventoryStockTransfer::with(['user', 'approvedBy', 'rejectedBy', 'fromLocation', 'toLocation', 'items' => function($q) {
            $q->with('product');
        }])->orderBy('date', 'desc')->orderBy('created_at', 'desc');

        if ($request->has('search')) {
            $search = $request->search;
            $query->where('transfer_no', 'like', "%{$search}%")
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
            'from_location_id' => 'required|exists:inventory_locations,id',
            'to_location_id' => 'required|exists:inventory_locations,id|different:from_location_id',
            'date' => 'required|date',
            'notes' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:inventory_products,id',
            'items.*.quantity' => 'required|numeric|gt:0',
            'status' => 'nullable|string|in:DRAFT,PENDING',
        ]);

        return DB::transaction(function() use ($validated, $documentNumberService) {
            // Generate Transfer No
            $transferNo = $documentNumberService->generate('stock_transfer');

            $transfer = InventoryStockTransfer::create([
                'transfer_no' => $transferNo,
                'from_location_id' => $validated['from_location_id'],
                'to_location_id' => $validated['to_location_id'],
                'date' => $validated['date'],
                'user_id' => Auth::id(),
                'notes' => $validated['notes'],
                'status' => $validated['status'] ?? 'DRAFT',
            ]);

            foreach ($validated['items'] as $itemData) {
                $transfer->items()->create($itemData);
            }

            return response()->json($transfer->load('items.product', 'fromLocation', 'toLocation'), 201);
        });
    }

    public function show($id)
    {
        $transfer = InventoryStockTransfer::with(['user', 'approvedBy', 'rejectedBy', 'fromLocation', 'toLocation', 'items.product'])->findOrFail($id);
        return response()->json($transfer);
    }

    public function update(Request $request, $id)
    {
        $transfer = InventoryStockTransfer::findOrFail($id);

        if ($transfer->status !== 'DRAFT') {
            return response()->json(['message' => 'Cannot update a non-draft transfer'], 422);
        }

        $validated = $request->validate([
            'from_location_id' => 'sometimes|required|exists:inventory_locations,id',
            'to_location_id' => 'sometimes|required|exists:inventory_locations,id|different:from_location_id',
            'date' => 'sometimes|required|date',
            'notes' => 'nullable|string',
            'items' => 'sometimes|required|array|min:1',
            'items.*.product_id' => 'required|exists:inventory_products,id',
            'items.*.quantity' => 'required|numeric|gt:0',
            'status' => 'nullable|string|in:DRAFT,PENDING',
        ]);

        return DB::transaction(function() use ($transfer, $validated) {
            $transfer->update($validated);

            if (isset($validated['items'])) {
                $transfer->items()->delete();
                foreach ($validated['items'] as $itemData) {
                    $transfer->items()->create($itemData);
                }
            }

            return response()->json($transfer->load('items.product', 'fromLocation', 'toLocation'));
        });
    }

    public function approve($id)
    {
        $transfer = InventoryStockTransfer::with('items')->findOrFail($id);

        if ($transfer->status !== 'PENDING') {
            return response()->json(['message' => 'Only pending transfers can be approved'], 422);
        }

        return DB::transaction(function() use ($transfer) {
            foreach ($transfer->items as $item) {
                $this->stockService->transferStock(
                    $item->product_id,
                    $transfer->from_location_id,
                    $transfer->to_location_id,
                    (float) $item->quantity,
                    $transfer,
                    $transfer->notes
                );
            }

            $transfer->update([
                'status' => 'APPROVED',
                'approved_by_id' => Auth::id(),
                'approved_at' => now(),
            ]);

            return response()->json($transfer->load('items.product', 'fromLocation', 'toLocation', 'approvedBy'));
        });
    }

    public function reject(Request $request, $id)
    {
        $transfer = InventoryStockTransfer::findOrFail($id);

        if ($transfer->status !== 'PENDING') {
            return response()->json(['message' => 'Only pending transfers can be rejected'], 422);
        }

        $request->validate(['reason' => 'required|string']);

        $transfer->update([
            'status' => 'REJECTED',
            'rejected_by_id' => Auth::id(),
            'rejected_at' => now(),
            'rejected_reason' => $request->reason,
        ]);

        return response()->json($transfer->load('items.product', 'fromLocation', 'toLocation', 'rejectedBy'));
    }

    public function destroy($id)
    {
        $transfer = InventoryStockTransfer::findOrFail($id);

        if ($transfer->status !== 'DRAFT') {
            return response()->json(['message' => 'Cannot delete a non-draft transfer'], 422);
        }

        $transfer->delete();
        return response()->json(['message' => 'Transfer deleted successfully']);
    }
}
