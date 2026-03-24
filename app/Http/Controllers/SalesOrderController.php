<?php

namespace App\Http\Controllers;

use App\Models\SalesOrder;
use App\Models\SalesOrderItem;
use App\Models\JobCard;
use App\Models\JobCardItem;
use App\Models\JobCardMaterialUsage;
use App\Models\Inventory\InventoryStock;
use App\Models\Inventory\InventoryStockMovement;
use App\Models\Inventory\InventoryLocation;
use App\Models\Service;
use App\Services\DocumentNumberService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;

class SalesOrderController extends Controller
{
    public function index(Request $request)
    {
        $query = SalesOrder::with(['customer', 'vehicle.brand', 'vehicle.model', 'creator']);
        
        if ($request->from_date && $request->to_date) {
            $query->whereBetween('order_date', [$request->from_date . ' 00:00:00', $request->to_date . ' 23:59:59']);
        }

        if ($request->payment_status && $request->payment_status !== 'ALL') {
            $query->where('payment_status', $request->payment_status);
        }

        if ($request->tax_status && $request->tax_status !== 'ALL') {
            if ($request->tax_status === 'VAT') {
                $query->where('tax_total', '>', 0);
            } else {
                $query->where(function($q) {
                    $q->where('tax_total', '<=', 0)->orWhereNull('tax_total');
                });
            }
        }

        if ($request->customer_id) {
            $query->where('customer_id', $request->customer_id);
        }

        if ($request->search) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('order_no', 'like', "%{$search}%")
                  ->orWhereHas('customer', function($cq) use ($search) {
                      $cq->where('name', 'like', "%{$search}%");
                  });
            });
        }

        return $query->latest()->paginate($request->per_page ?? 15);
    }

    public function store(Request $request, DocumentNumberService $documentNumberService)
    {
        $validated = $request->validate([
            'customer_id' => 'required|exists:customers,id',
            'branch_id' => 'required|exists:branches,id',
            'vehicle_id' => 'nullable|exists:customer_vehicles,id',
            'invoice_image' => 'nullable|file|mimes:jpg,jpeg,png,pdf|max:2048',
            'order_date' => 'required|date',
            'items' => 'required|array|min:1',
            'items.*.service_id' => 'nullable|exists:services,id',
            'items.*.product_id' => 'nullable|exists:inventory_products,id',
            'items.*.job_part_id' => 'nullable|exists:job_parts_master,id',
            'items.*.qty' => 'required|numeric|min:0.01',
            'items.*.unit_price' => 'required|numeric|min:0',
            'items.*.discount' => 'nullable|numeric|min:0',
            'subtotal' => 'required|numeric',
            'taxable_amount' => 'nullable|numeric',
            'tax_percent' => 'nullable|numeric',
            'tax_total' => 'nullable|numeric',
            'discount_type' => 'nullable|string|in:FIXED,PERCENT',
            'discount_value' => 'nullable|numeric',
            'discount_total' => 'nullable|numeric',
            'grand_total' => 'required|numeric',
            'deposits' => 'nullable|array',
            'deposits.*.amount' => 'required|numeric|min:0',
            'deposits.*.payment_account_id' => 'required|exists:payment_accounts,id',
            'deposits.*.date' => 'required|date',
            'deposits.*.notes' => 'nullable|string',
            'deposits.*.receipt' => 'nullable|file|max:2048',
            'notes' => 'nullable|string',
        ]);

        $order = null;

        DB::transaction(function () use ($request, $validated, $documentNumberService, &$order) {
            $orderNo = $documentNumberService->generate('sales_order');

            $totalPaid = collect($validated['deposits'] ?? [])->sum('amount');

            $invoiceImagePath = null;
            if ($request->hasFile('invoice_image')) {
                $invoiceImagePath = $request->file('invoice_image')->store('invoices', 'public');
            }

            $order = SalesOrder::create([
                'order_no' => $orderNo,
                'customer_id' => $validated['customer_id'],
                'branch_id' => $validated['branch_id'],
                'vehicle_id' => $validated['vehicle_id'] ?? null,
                'invoice_image_path' => $invoiceImagePath ? '/storage/' . $invoiceImagePath : null,
                'order_date' => $validated['order_date'],
                'subtotal' => $validated['subtotal'],
                'taxable_amount' => $validated['taxable_amount'] ?? 0,
                'tax_percent' => $validated['tax_percent'] ?? 0,
                'tax_total' => $validated['tax_total'] ?? 0,
                'discount_type' => $validated['discount_type'] ?? 'FIXED',
                'discount_value' => $validated['discount_value'] ?? 0,
                'discount_total' => $validated['discount_total'] ?? 0,
                'grand_total' => $validated['grand_total'],
                'paid_amount' => $totalPaid,
                'balance_amount' => $validated['grand_total'] - $totalPaid,
                'status' => 'CONFIRMED',
                'payment_status' => $totalPaid >= $validated['grand_total'] ? 'PAID' : ($totalPaid > 0 ? 'PARTIAL' : 'UNPAID'),
                'notes' => $validated['notes'] ?? null,
                'created_by' => Auth::id() ?? 1,
            ]);

            // Create deposits
            foreach ($validated['deposits'] ?? [] as $index => $dep) {
                $depositReceiptPath = null;
                if ($request->hasFile("deposits.{$index}.receipt")) {
                    $path = $request->file("deposits.{$index}.receipt")->store('receipts/deposits', 'public');
                    if ($path) {
                        $depositReceiptPath = '/storage/' . $path;
                    }
                }

                \App\Models\SalesOrderDeposit::create([
                    'sales_order_id' => $order->id,
                    'amount' => $dep['amount'],
                    'payment_account_id' => $dep['payment_account_id'],
                    'deposit_date' => $dep['date'],
                    'receipt_path' => $depositReceiptPath,
                    'notes' => $dep['notes'] ?? null,
                    'created_by' => Auth::id() ?? 1,
                ]);
            }

            // --- STOCK DEDUCTION LOGIC ---
            $location = InventoryLocation::where('branch_id', $validated['branch_id'])
                ->where('is_active', true)
                ->orderBy('is_primary', 'desc') // Prioritize primary location
                ->first();

            if (!$location) {
                // Fallback to first location if no active/primary one found
                $location = InventoryLocation::where('branch_id', $validated['branch_id'])->first();
            }

            $hasService = false;
            $itemsWithJobParts = [];

            foreach ($validated['items'] as $itemData) {
                $itemable_type = null;
                $itemable_id = null;
                $item_name = 'Unknown Item';

                if (!empty($itemData['service_id'])) {
                    $service = Service::find($itemData['service_id']);
                    $itemable_type = Service::class;
                    $itemable_id = $service->id;
                    $item_name = $service->name;
                    $hasService = true;
                } elseif (!empty($itemData['product_id'])) {
                    $product = \App\Models\Inventory\InventoryProduct::find($itemData['product_id']);
                    $itemable_type = \App\Models\Inventory\InventoryProduct::class;
                    $itemable_id = $product->id;
                    $item_name = $product->name;
                }

                $orderItem = SalesOrderItem::create([
                    'sales_order_id' => $order->id,
                    'itemable_type' => $itemable_type,
                    'itemable_id' => $itemable_id,
                    'job_part_id' => $itemData['job_part_id'] ?? null,
                    'item_name' => $item_name,
                    'quantity' => $itemData['qty'],
                    'unit_price' => $itemData['unit_price'],
                    'discount_amount' => $itemData['discount'] ?? 0,
                    'subtotal' => ($itemData['qty'] * $itemData['unit_price']) - ($itemData['discount'] ?? 0),
                ]);

                if (!empty($itemData['job_part_id']) && !empty($itemData['product_id'])) {
                    $itemsWithJobParts[] = [
                        'product_id' => $itemData['product_id'],
                        'job_part_id' => $itemData['job_part_id'],
                        'qty' => $itemData['qty'],
                        'service_id' => $itemData['service_id'] ?? null
                    ];
                }

                // Deduct Stock for DIRECT product sales ONLY
                if ($location && !empty($itemData['product_id']) && empty($itemData['job_part_id'])) {
                    $stock = InventoryStock::firstOrCreate(
                        ['product_id' => $itemData['product_id'], 'location_id' => $location->id],
                        ['quantity' => 0]
                    );

                    $previousQty = $stock->quantity;
                    $stock->decrement('quantity', $itemData['qty']);
                    $stock->touch(); // Manually update timestamps if needed, though decrement might do it

                    InventoryStockMovement::create([
                        'product_id' => $itemData['product_id'],
                        'location_id' => $location->id,
                        'user_id' => Auth::id() ?? 1,
                        'movement_type' => 'OUT',
                        'quantity' => $itemData['qty'],
                        'previous_quantity' => $previousQty,
                        'current_quantity' => $previousQty - $itemData['qty'],
                        'reference_type' => SalesOrder::class,
                        'reference_id' => $order->id,
                        'reason' => "Sales Order #{$order->order_no} direct sale",
                    ]);
                }
            }

            // If any item is a service (or linked to a service part), create a Job Card
            if ($hasService || !empty($itemsWithJobParts)) {
                $this->generateJobCard($order, $validated['items'], $itemsWithJobParts, $documentNumberService);
            }
        });

        return response()->json($order->load(['customer', 'items', 'jobCard.items']), 201);
    }

    private function generateJobCard(SalesOrder $order, array $itemsData, array $itemsWithJobParts, DocumentNumberService $documentNumberService)
    {
        $jobNo = $documentNumberService->generate('job_card');
        $jobCard = JobCard::create([
            'job_no' => $jobNo,
            'sales_order_id' => $order->id,
            'branch_id' => $order->branch_id,
            'customer_id' => $order->customer_id,
            'vehicle_id' => $order->vehicle_id,
            'status' => 'PENDING',
        ]);

        // 1. Process explicit services added as main items
        foreach ($itemsData as $itemData) {
            if (!empty($itemData['service_id']) && empty($itemData['job_part_id'])) {
                $service = Service::with(['parts', 'materials'])->find($itemData['service_id']);
                
                $parentJobItem = JobCardItem::create([
                    'job_card_id' => $jobCard->id,
                    'service_id' => $service->id,
                    'part_id' => null,
                    'status' => 'PENDING',
                ]);

                // Add parts that DON'T have a specific product selected in this sale
                foreach ($service->parts as $part) {
                    $isExplicitlyHandled = collect($itemsWithJobParts)->where('job_part_id', $part->id)->where('service_id', $service->id)->first();
                    if (!$isExplicitlyHandled) {
                        JobCardItem::create([
                            'job_card_id' => $jobCard->id,
                            'service_id' => $service->id,
                            'part_id' => $part->id,
                            'status' => 'PENDING',
                        ]);
                    }
                }

                // Map standard materials
                foreach ($service->materials as $mat) {
                    \App\Models\JobCardMaterialUsage::create([
                        'job_card_id' => $jobCard->id,
                        'job_card_item_id' => $parentJobItem->id,
                        'product_id' => $mat->product_id,
                        'spent_qty' => $mat->suggested_qty * $itemData['qty'],
                        'actual_qty' => 0,
                        'unit' => 'pcs',
                    ]);
                }
            }
        }

        // 2. Process products explicitly linked to parts
        foreach ($itemsWithJobParts as $pLink) {
            $jobItem = JobCardItem::create([
                'job_card_id' => $jobCard->id,
                'service_id' => $pLink['service_id'],
                'part_id' => $pLink['job_part_id'],
                'status' => 'PENDING',
            ]);

            \App\Models\JobCardMaterialUsage::create([
                'job_card_id' => $jobCard->id,
                'job_card_item_id' => $jobItem->id,
                'product_id' => $pLink['product_id'],
                'spent_qty' => $pLink['qty'],
                'actual_qty' => 0,
                'unit' => 'pcs',
            ]);
        }
    }

    public function addDeposit(Request $request, $id)
    {
        $validated = $request->validate([
            'amount' => 'required|numeric|min:0.01',
            'payment_account_id' => 'required|exists:payment_accounts,id',
            'deposit_date' => 'required|date',
            'receipt' => 'nullable|file|max:2048',
            'notes' => 'nullable|string',
        ]);

        $order = SalesOrder::findOrFail($id);

        DB::transaction(function() use ($request, $validated, $order) {
            $depositReceiptPath = null;
            if ($request->hasFile('receipt')) {
                $path = $request->file('receipt')->store('receipts/deposits', 'public');
                if ($path) {
                    $depositReceiptPath = '/storage/' . $path;
                }
            }

            \App\Models\SalesOrderDeposit::create([
                'sales_order_id' => $order->id,
                'amount' => $validated['amount'],
                'payment_account_id' => $validated['payment_account_id'],
                'deposit_date' => $validated['deposit_date'],
                'receipt_path' => $depositReceiptPath,
                'notes' => $validated['notes'] ?? null,
                'created_by' => Auth::id() ?? 1,
            ]);

            // Update order totals
            $order->paid_amount += $validated['amount'];
            $order->balance_amount = round($order->grand_total - $order->paid_amount, 2);

            // Update payment status
            if ($order->balance_amount <= 0.01) { // Small threshold for floating point
                $order->payment_status = 'PAID';
                $order->balance_amount = 0;
            } elseif ($order->paid_amount > 0) {
                $order->payment_status = 'PARTIAL';
            } else {
                $order->payment_status = 'UNPAID';
            }

            $order->save();
        });

        return response()->json($order->load('deposits.paymentAccount'), 201);
    }

    public function updateDeposit(Request $request, $id)
    {
        $validated = $request->validate([
            'amount' => 'required|numeric|min:0',
            'payment_account_id' => 'required|exists:payment_accounts,id',
            'deposit_date' => 'required|date',
            'receipt' => 'nullable|file|max:2048',
            'notes' => 'nullable|string',
        ]);

        $deposit = \App\Models\SalesOrderDeposit::findOrFail($id);
        $order = $deposit->order;

        DB::transaction(function() use ($request, $validated, $deposit, $order) {
            $depositReceiptPath = $deposit->receipt_path;
            if ($request->hasFile('receipt')) {
                $path = $request->file('receipt')->store('receipts/deposits', 'public');
                if ($path) {
                    $depositReceiptPath = '/storage/' . $path;
                }
            }

            $deposit->update([
                'amount' => $validated['amount'],
                'payment_account_id' => $validated['payment_account_id'],
                'deposit_date' => $validated['deposit_date'],
                'receipt_path' => $depositReceiptPath,
                'notes' => $validated['notes'] ?? null,
            ]);

            // Recalculate order totals
            $totalPaid = $order->deposits()->sum('amount');
            $order->paid_amount = $totalPaid;
            $order->balance_amount = round($order->grand_total - $totalPaid, 2);

            // Update payment status
            if ($order->balance_amount <= 0.01) {
                $order->payment_status = 'PAID';
                $order->balance_amount = 0;
            } elseif ($order->paid_amount > 0) {
                $order->payment_status = 'PARTIAL';
            } else {
                $order->payment_status = 'UNPAID';
            }

            $order->save();
        });

        return response()->json($order->load(['deposits.paymentAccount', 'deposits.creator']), 200);
    }

    public function deleteDeposit($id)
    {
        $deposit = \App\Models\SalesOrderDeposit::findOrFail($id);
        $order = $deposit->order;

        DB::transaction(function() use ($deposit, $order) {
            $deposit->delete();

            // Recalculate order totals
            $totalPaid = $order->deposits()->sum('amount');
            $order->paid_amount = $totalPaid;
            $order->balance_amount = round($order->grand_total - $totalPaid, 2);

            // Update payment status
            if ($order->balance_amount <= 0.01) {
                if ($order->paid_amount > 0) {
                    $order->payment_status = 'PAID';
                } else {
                    $order->payment_status = 'UNPAID';
                }
                $order->balance_amount = 0;
            } elseif ($order->paid_amount > 0) {
                $order->payment_status = 'PARTIAL';
            } else {
                $order->payment_status = 'UNPAID';
            }

            $order->save();
        });

        return response()->json($order->load(['deposits.paymentAccount', 'deposits.creator']), 200);
    }

    public function show($id)
    {
        return SalesOrder::with(['customer', 'vehicle.brand', 'vehicle.model', 'items.itemable', 'jobCard.items.part', 'jobCard.materialUsage.product', 'deposits.paymentAccount', 'deposits.creator', 'creator'])->findOrFail($id);
    }

    public function cancel($id)
    {
        $order = SalesOrder::findOrFail($id);
        if ($order->status === 'Completed') {
            return response()->json(['message' => 'Cannot cancel a completed order'], 422);
        }
        
        DB::transaction(function() use ($order) {
            if ($order->status === 'Cancelled') return;

            $order->update(['status' => 'Cancelled']);
            
            if ($order->jobCard) {
                $order->jobCard->update(['status' => 'Cancelled']);
            }

            // --- STOCK RESTOCK LOGIC ---
            $location = InventoryLocation::where('branch_id', $order->branch_id)
                ->where('is_active', true)
                ->orderBy('is_primary', 'desc') // Prioritize primary location
                ->first() ?: InventoryLocation::where('branch_id', $order->branch_id)->first();

            if ($location) {
                foreach ($order->items as $item) {
                    // Only restock direct product sales (mimics the logic in store())
                    if ($item->itemable_type === \App\Models\Inventory\InventoryProduct::class && empty($item->job_part_id)) {
                        $stock = InventoryStock::where('product_id', $item->itemable_id)
                            ->where('location_id', $location->id)
                            ->first();

                        if ($stock) {
                            $previousQty = $stock->quantity;
                            $stock->increment('quantity', $item->quantity);
                            
                            InventoryStockMovement::create([
                                'product_id' => $item->itemable_id,
                                'location_id' => $location->id,
                                'user_id' => Auth::id() ?? 1,
                                'movement_type' => 'IN',
                                'quantity' => $item->quantity,
                                'previous_quantity' => $previousQty,
                                'current_quantity' => $previousQty + $item->quantity,
                                'reference_type' => SalesOrder::class,
                                'reference_id' => $order->id,
                                'reason' => "Sales Order #{$order->order_no} cancellation restock",
                            ]);
                        }
                    }
                }
            }
        });

        return response()->json(['message' => 'Order cancelled successfully']);
    }
    public function update(Request $request, $id, DocumentNumberService $documentNumberService)
    {
        $validated = $request->validate([
            'customer_id' => 'required|exists:customers,id',
            'branch_id' => 'required|exists:branches,id',
            'vehicle_id' => 'nullable|exists:customer_vehicles,id',
            'invoice_image' => 'nullable|file|mimes:jpg,jpeg,png,pdf|max:2048',
            'order_date' => 'required|date',
            'items' => 'required|array|min:1',
            'items.*.service_id' => 'nullable|exists:services,id',
            'items.*.product_id' => 'nullable|exists:inventory_products,id',
            'items.*.job_part_id' => 'nullable|exists:job_parts_master,id',
            'items.*.qty' => 'required|numeric|min:0.01',
            'items.*.unit_price' => 'required|numeric|min:0',
            'items.*.discount' => 'nullable|numeric|min:0',
            'subtotal' => 'required|numeric',
            'taxable_amount' => 'nullable|numeric',
            'tax_percent' => 'nullable|numeric',
            'tax_total' => 'nullable|numeric',
            'discount_type' => 'nullable|string|in:FIXED,PERCENT',
            'discount_value' => 'nullable|numeric',
            'discount_total' => 'nullable|numeric',
            'grand_total' => 'required|numeric',
            'notes' => 'nullable|string',
        ]);

        $order = SalesOrder::with('items')->findOrFail($id);

        DB::transaction(function () use ($request, $validated, $documentNumberService, $order) {
            // 1. RESTOCK OLD ITEMS
            $location = \App\Models\Inventory\InventoryLocation::where('branch_id', $order->branch_id)
                ->where('is_active', true)
                ->orderBy('is_primary', 'desc')
                ->first() ?: \App\Models\Inventory\InventoryLocation::where('branch_id', $order->branch_id)->first();

            if ($location) {
                foreach ($order->items as $item) {
                    if ($item->itemable_type === \App\Models\Inventory\InventoryProduct::class && empty($item->job_part_id)) {
                        $stock = \App\Models\Inventory\InventoryStock::firstOrCreate(
                            ['product_id' => $item->itemable_id, 'location_id' => $location->id],
                            ['quantity' => 0]
                        );
                        $previousQty = $stock->quantity;
                        $stock->increment('quantity', $item->quantity);

                        \App\Models\Inventory\InventoryStockMovement::create([
                            'product_id' => $item->itemable_id,
                            'location_id' => $location->id,
                            'user_id' => Auth::id() ?? 1,
                            'movement_type' => 'IN',
                            'quantity' => $item->quantity,
                            'previous_quantity' => $previousQty,
                            'current_quantity' => $previousQty + $item->quantity,
                            'reference_type' => SalesOrder::class,
                            'reference_id' => $order->id,
                            'reason' => "Sales Order #{$order->order_no} update reversal",
                        ]);
                    }
                }
            }

            // 2. UPDATE ORDER DATA
            $invoiceImagePath = $order->invoice_image_path;
            if ($request->hasFile('invoice_image')) {
                $invoiceImagePath = '/storage/' . $request->file('invoice_image')->store('invoices', 'public');
            }

            $order->update([
                'customer_id' => $validated['customer_id'],
                'branch_id' => $validated['branch_id'],
                'vehicle_id' => $validated['vehicle_id'] ?? null,
                'invoice_image_path' => $invoiceImagePath,
                'order_date' => $validated['order_date'],
                'subtotal' => $validated['subtotal'],
                'taxable_amount' => $validated['taxable_amount'] ?? 0,
                'tax_percent' => $validated['tax_percent'] ?? 0,
                'tax_total' => $validated['tax_total'] ?? 0,
                'discount_type' => $validated['discount_type'] ?? 'FIXED',
                'discount_value' => $validated['discount_value'] ?? 0,
                'discount_total' => $validated['discount_total'] ?? 0,
                'grand_total' => $validated['grand_total'],
                'balance_amount' => $validated['grand_total'] - $order->paid_amount,
                'payment_status' => $order->paid_amount >= $validated['grand_total'] ? 'PAID' : ($order->paid_amount > 0 ? 'PARTIAL' : 'UNPAID'),
                'notes' => $validated['notes'] ?? null,
            ]);

            // 3. DELETE OLD ITEMS & CREATE NEW ONES + DEDUCT STOCK
            $order->items()->delete();

            $hasService = false;
            $itemsWithJobParts = [];

            // Get location for new branch (might have changed)
            $newLocation = \App\Models\Inventory\InventoryLocation::where('branch_id', $validated['branch_id'])
                ->where('is_active', true)
                ->orderBy('is_primary', 'desc')
                ->first() ?: \App\Models\Inventory\InventoryLocation::where('branch_id', $validated['branch_id'])->first();

            foreach ($validated['items'] as $itemData) {
                $itemable_type = null;
                $itemable_id = null;
                $item_name = 'Unknown Item';

                if (!empty($itemData['service_id'])) {
                    $service = \App\Models\Service::find($itemData['service_id']);
                    $itemable_type = \App\Models\Service::class;
                    $itemable_id = $service->id;
                    $item_name = $service->name;
                    $hasService = true;
                } elseif (!empty($itemData['product_id'])) {
                    $product = \App\Models\Inventory\InventoryProduct::find($itemData['product_id']);
                    $itemable_type = \App\Models\Inventory\InventoryProduct::class;
                    $itemable_id = $product->id;
                    $item_name = $product->name;
                }

                SalesOrderItem::create([
                    'sales_order_id' => $order->id,
                    'itemable_type' => $itemable_type,
                    'itemable_id' => $itemable_id,
                    'job_part_id' => $itemData['job_part_id'] ?? null,
                    'item_name' => $item_name,
                    'quantity' => $itemData['qty'],
                    'unit_price' => $itemData['unit_price'],
                    'discount_amount' => $itemData['discount'] ?? 0,
                    'subtotal' => ($itemData['qty'] * $itemData['unit_price']) - ($itemData['discount'] ?? 0),
                ]);

                if (!empty($itemData['job_part_id']) && !empty($itemData['product_id'])) {
                    $itemsWithJobParts[] = [
                        'product_id' => $itemData['product_id'],
                        'job_part_id' => $itemData['job_part_id'],
                        'qty' => $itemData['qty'],
                        'service_id' => $itemData['service_id'] ?? null
                    ];
                }

                if ($newLocation && !empty($itemData['product_id']) && empty($itemData['job_part_id'])) {
                    $stock = \App\Models\Inventory\InventoryStock::firstOrCreate(
                        ['product_id' => $itemData['product_id'], 'location_id' => $newLocation->id],
                        ['quantity' => 0]
                    );
                    $previousQty = $stock->quantity;
                    $stock->decrement('quantity', $itemData['qty']);

                    \App\Models\Inventory\InventoryStockMovement::create([
                        'product_id' => $itemData['product_id'],
                        'location_id' => $newLocation->id,
                        'user_id' => Auth::id() ?? 1,
                        'movement_type' => 'OUT',
                        'quantity' => $itemData['qty'],
                        'previous_quantity' => $previousQty,
                        'current_quantity' => $previousQty - $itemData['qty'],
                        'reference_type' => SalesOrder::class,
                        'reference_id' => $order->id,
                        'reason' => "Sales Order #{$order->order_no} update deduction",
                    ]);
                }
            }

            // 4. SYNC JOB CARD
            if ($order->jobCard) {
                $order->jobCard->update([
                    'branch_id' => $order->branch_id,
                    'customer_id' => $order->customer_id,
                    'vehicle_id' => $order->vehicle_id,
                ]);
                $order->jobCard->items()->delete();
                \App\Models\JobCardMaterialUsage::where('job_card_id', $order->jobCard->id)->delete();

                if ($hasService || !empty($itemsWithJobParts)) {
                    $this->repopulateJobCard($order->jobCard, $validated['items'], $itemsWithJobParts);
                } else {
                    $order->jobCard->update(['status' => 'CANCELLED']);
                }
            } elseif ($hasService || !empty($itemsWithJobParts)) {
                $this->generateJobCard($order, $validated['items'], $itemsWithJobParts, $documentNumberService);
            }
        });

        return response()->json($order->refresh()->load(['customer', 'items', 'jobCard.items']));
    }

    private function repopulateJobCard(JobCard $jobCard, array $itemsData, array $itemsWithJobParts)
    {
        foreach ($itemsData as $itemData) {
            if (!empty($itemData['service_id']) && empty($itemData['job_part_id'])) {
                $service = \App\Models\Service::with(['parts', 'materials'])->find($itemData['service_id']);
                
                $parentJobItem = JobCardItem::create([
                    'job_card_id' => $jobCard->id,
                    'service_id' => $service->id,
                    'part_id' => null,
                    'status' => 'PENDING',
                ]);

                foreach ($service->parts as $part) {
                    $isExplicitlyHandled = collect($itemsWithJobParts)->where('job_part_id', $part->id)->where('service_id', $service->id)->first();
                    if (!$isExplicitlyHandled) {
                        JobCardItem::create([
                            'job_card_id' => $jobCard->id,
                            'service_id' => $service->id,
                            'part_id' => $part->id,
                            'status' => 'PENDING',
                        ]);
                    }
                }

                foreach ($service->materials as $mat) {
                    \App\Models\JobCardMaterialUsage::create([
                        'job_card_id' => $jobCard->id,
                        'job_card_item_id' => $parentJobItem->id,
                        'product_id' => $mat->product_id,
                        'spent_qty' => $mat->suggested_qty * $itemData['qty'],
                        'actual_qty' => 0,
                        'unit' => 'pcs',
                    ]);
                }
            }
        }

        foreach ($itemsWithJobParts as $pLink) {
            $jobItem = JobCardItem::create([
                'job_card_id' => $jobCard->id,
                'service_id' => $pLink['service_id'],
                'part_id' => $pLink['job_part_id'],
                'status' => 'PENDING',
            ]);

            \App\Models\JobCardMaterialUsage::create([
                'job_card_id' => $jobCard->id,
                'job_card_item_id' => $jobItem->id,
                'product_id' => $pLink['product_id'],
                'spent_qty' => $pLink['qty'],
                'actual_qty' => 0,
                'unit' => 'pcs',
            ]);
        }
    }
}
