<?php

namespace App\Http\Controllers\Inventory;

use App\Http\Controllers\Controller;
use App\Models\Inventory\InventoryPurchaseOrder;
use App\Models\Inventory\InventoryPurchaseOrderItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PurchaseOrderController extends Controller
{
    public function index(Request $request)
    {
        $query = InventoryPurchaseOrder::with(['supplier', 'items.product']);

        if ($request->filled('start_date')) {
            $query->whereDate('order_date', '>=', $request->start_date);
        }
        if ($request->filled('end_date')) {
            $query->whereDate('order_date', '<=', $request->end_date);
        }
        if ($request->filled('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }
        if ($request->filled('supplier_id') && $request->supplier_id !== 'all') {
            $query->where('supplier_id', $request->supplier_id);
        }

        $orders = $query->orderBy('created_at', 'desc')->get();

        return response()->json($orders);
    }

    public function store(Request $request, \App\Services\DocumentNumberService $documentNumberService)
    {
        $validated = $request->validate([
            'supplier_id'            => 'required|exists:inventory_suppliers,id',
            'order_date'             => 'required|date',
            'expected_delivery_date' => 'nullable|date',
            'status'                 => 'in:Draft,Ordered,Partial,Completed,Cancelled',
            'note'                   => 'nullable|string',
            'items'                  => 'required|array|min:1',
            'items.*.product_id'     => 'required|exists:inventory_products,id',
            'items.*.order_qty'      => 'required|numeric|min:0.01',
            'items.*.unit_cost'      => 'required|numeric|min:0',
        ]);

        DB::transaction(function () use ($validated, $request, $documentNumberService, &$order) {
            // Auto-generate PO number
            $poNumber = $documentNumberService->generate('purchase_order');

            $totalAmount = 0;
            foreach ($validated['items'] as $item) {
                $totalAmount += $item['order_qty'] * $item['unit_cost'];
            }

            $order = InventoryPurchaseOrder::create([
                'supplier_id'            => $validated['supplier_id'],
                'po_number'              => $poNumber,
                'order_date'             => $validated['order_date'],
                'expected_delivery_date' => $validated['expected_delivery_date'] ?? null,
                'status'                 => $validated['status'] ?? 'Draft',
                'total_amount'           => $totalAmount,
                'note'                   => $validated['note'] ?? null,
            ]);

            foreach ($validated['items'] as $item) {
                InventoryPurchaseOrderItem::create([
                    'purchase_order_id' => $order->id,
                    'product_id'        => $item['product_id'],
                    'order_qty'         => $item['order_qty'],
                    'unit_cost'         => $item['unit_cost'],
                    'total_cost'        => $item['order_qty'] * $item['unit_cost'],
                    'received_qty'      => 0,
                ]);
            }
        });

        return response()->json($order->load(['supplier', 'items.product']), 201);
    }

    public function show($id)
    {
        $order = InventoryPurchaseOrder::with(['supplier', 'items.product'])->findOrFail($id);
        return response()->json($order);
    }

    public function update(Request $request, $id)
    {
        $order = InventoryPurchaseOrder::findOrFail($id);

        if (in_array($order->status, ['Completed', 'Cancelled'])) {
            return response()->json(['message' => 'Cannot edit a Completed or Cancelled PO.'], 422);
        }

        $validated = $request->validate([
            'supplier_id'            => 'sometimes|exists:inventory_suppliers,id',
            'order_date'             => 'sometimes|date',
            'expected_delivery_date' => 'nullable|date',
            'status'                 => 'sometimes|in:Draft,Ordered,Partial,Completed,Cancelled',
            'note'                   => 'nullable|string',
            'items'                  => 'sometimes|array|min:1',
            'items.*.product_id'     => 'required_with:items|exists:inventory_products,id',
            'items.*.order_qty'      => 'required_with:items|numeric|min:0.01',
            'items.*.unit_cost'      => 'required_with:items|numeric|min:0',
        ]);

        DB::transaction(function () use ($validated, $order) {
            if (isset($validated['items'])) {
                $order->items()->delete();

                $totalAmount = 0;
                foreach ($validated['items'] as $item) {
                    $totalAmount += $item['order_qty'] * $item['unit_cost'];
                    InventoryPurchaseOrderItem::create([
                        'purchase_order_id' => $order->id,
                        'product_id'        => $item['product_id'],
                        'order_qty'         => $item['order_qty'],
                        'unit_cost'         => $item['unit_cost'],
                        'total_cost'        => $item['order_qty'] * $item['unit_cost'],
                        'received_qty'      => 0,
                    ]);
                }
                $validated['total_amount'] = $totalAmount;
                unset($validated['items']);
            }

            $order->update($validated);
        });

        return response()->json($order->fresh()->load(['supplier', 'items.product']));
    }

    public function destroy($id)
    {
        $order = InventoryPurchaseOrder::findOrFail($id);

        if ($order->status !== 'Draft') {
            return response()->json(['message' => 'Only Draft POs can be deleted.'], 422);
        }

        $order->delete();
        return response()->json(['message' => 'Purchase Order deleted successfully']);
    }
}
