<?php

namespace App\Http\Controllers;

use App\Models\SalesOrder;
use App\Models\SalesOrderItem;
use App\Models\JobCard;
use App\Models\JobCardItem;
use App\Models\JobCardMaterialUsage;
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
            'payment_account_id' => 'nullable|exists:payment_accounts,id',
            'receipt' => 'nullable|file|mimes:jpg,jpeg,png,pdf|max:2048',
            'order_date' => 'required|date',
            'items' => 'required|array|min:1',
            'items.*.service_id' => 'nullable|exists:services,id',
            'items.*.product_id' => 'nullable|exists:inventory_products,id',
            'items.*.job_part_id' => 'nullable|exists:job_parts_master,id',
            'items.*.qty' => 'required|numeric|min:0.01',
            'items.*.unit_price' => 'required|numeric|min:0',
            'items.*.discount' => 'nullable|numeric|min:0',
            'subtotal' => 'required|numeric',
            'tax_total' => 'nullable|numeric',
            'discount_total' => 'nullable|numeric',
            'grand_total' => 'required|numeric',
            'deposits' => 'nullable|array',
            'deposits.*.amount' => 'required|numeric|min:0',
            'deposits.*.method' => 'required|string',
            'deposits.*.date' => 'required|date',
            'deposits.*.notes' => 'nullable|string',
            'notes' => 'nullable|string',
        ]);

        $order = null;

        DB::transaction(function () use ($request, $validated, $documentNumberService, &$order) {
            $orderNo = $documentNumberService->generate('sales_order');

            $totalPaid = collect($validated['deposits'] ?? [])->sum('amount');
            
            $receiptPath = null;
            if ($request->hasFile('receipt')) {
                $receiptPath = $request->file('receipt')->store('receipts', 'public');
            }

            $order = SalesOrder::create([
                'order_no' => $orderNo,
                'customer_id' => $validated['customer_id'],
                'branch_id' => $validated['branch_id'],
                'vehicle_id' => $validated['vehicle_id'] ?? null,
                'payment_account_id' => $validated['payment_account_id'] ?? null,
                'receipt_path' => $receiptPath ? '/storage/' . $receiptPath : null,
                'order_date' => $validated['order_date'],
                'subtotal' => $validated['subtotal'],
                'tax_total' => $validated['tax_total'] ?? 0,
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
            foreach ($validated['deposits'] ?? [] as $dep) {
                \App\Models\SalesOrderDeposit::create([
                    'sales_order_id' => $order->id,
                    'amount' => $dep['amount'],
                    'payment_method' => $dep['method'],
                    'deposit_date' => $dep['date'],
                    'notes' => $dep['notes'] ?? null,
                ]);
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
            }

            // If any item is a service (or linked to a service part), create a Job Card
            if ($hasService || !empty($itemsWithJobParts)) {
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
                foreach ($validated['items'] as $itemData) {
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
                            JobCardMaterialUsage::create([
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

                    JobCardMaterialUsage::create([
                        'job_card_id' => $jobCard->id,
                        'job_card_item_id' => $jobItem->id,
                        'product_id' => $pLink['product_id'],
                        'spent_qty' => $pLink['qty'],
                        'actual_qty' => 0,
                        'unit' => 'pcs',
                    ]);
                }
            }
        });

        return response()->json($order->load(['customer', 'items', 'jobCard.items']), 201);
    }

    public function show($id)
    {
        return SalesOrder::with(['customer', 'vehicle.brand', 'vehicle.model', 'items.service', 'items.product', 'jobCard.items.part', 'jobCard.materialUsage.product'])->findOrFail($id);
    }

    public function cancel($id)
    {
        $order = SalesOrder::findOrFail($id);
        if ($order->status === 'Completed') {
            return response()->json(['message' => 'Cannot cancel a completed order'], 422);
        }
        
        DB::transaction(function() use ($order) {
            $order->update(['status' => 'Cancelled']);
            if ($order->jobCard) {
                $order->jobCard->update(['status' => 'Cancelled']);
            }
        });

        return response()->json(['message' => 'Order cancelled successfully']);
    }
}
