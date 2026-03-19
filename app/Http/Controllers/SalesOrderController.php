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

        return $query->latest()->get();
    }

    public function store(Request $request, DocumentNumberService $documentNumberService)
    {
        $validated = $request->validate([
            'customer_id' => 'required|exists:customers,id',
            'branch_id' => 'required|exists:branches,id',
            'vehicle_id' => 'required|exists:customer_vehicles,id',
            'order_date' => 'required|date',
            'items' => 'required|array|min:1',
            'items.*.service_id' => 'nullable|exists:services,id',
            'items.*.product_id' => 'nullable|exists:inventory_products,id',
            'items.*.qty' => 'required|numeric|min:0.01',
            'items.*.unit_price' => 'required|numeric|min:0',
            'items.*.discount' => 'nullable|numeric|min:0',
            'subtotal' => 'required|numeric',
            'tax_total' => 'nullable|numeric',
            'discount_total' => 'nullable|numeric',
            'grand_total' => 'required|numeric',
            'notes' => 'nullable|string',
        ]);

        $order = null;

        DB::transaction(function () use ($validated, $documentNumberService, &$order) {
            $orderNo = $documentNumberService->generate('sales_order');

            $order = SalesOrder::create([
                'order_no' => $orderNo,
                'customer_id' => $validated['customer_id'],
                'branch_id' => $validated['branch_id'],
                'vehicle_id' => $validated['vehicle_id'],
                'order_date' => $validated['order_date'],
                'subtotal' => $validated['subtotal'],
                'tax_total' => $validated['tax_total'] ?? 0,
                'discount_total' => $validated['discount_total'] ?? 0,
                'grand_total' => $validated['grand_total'],
                'status' => 'Pending',
                'payment_status' => 'Unpaid',
                'notes' => $validated['notes'] ?? null,
                'created_by' => Auth::id() ?? 1, // Fallback if no auth session
            ]);

            $hasService = false;
            foreach ($validated['items'] as $itemData) {
                SalesOrderItem::create([
                    'sales_order_id' => $order->id,
                    'service_id' => $itemData['service_id'] ?? null,
                    'product_id' => $itemData['product_id'] ?? null,
                    'qty' => $itemData['qty'],
                    'unit_price' => $itemData['unit_price'],
                    'discount' => $itemData['discount'] ?? 0,
                    'total_price' => ($itemData['qty'] * $itemData['unit_price']) - ($itemData['discount'] ?? 0),
                ]);

                if (!empty($itemData['service_id'])) {
                    $hasService = true;
                }
            }

            // If any item is a service, create a Job Card
            if ($hasService) {
                $jobNo = $documentNumberService->generate('job_card');
                $jobCard = JobCard::create([
                    'job_no' => $jobNo,
                    'sales_order_id' => $order->id,
                    'branch_id' => $order->branch_id,
                    'customer_id' => $order->customer_id,
                    'vehicle_id' => $order->vehicle_id,
                    'status' => 'Pending',
                ]);

                // Populate Job Card Items from Service Mappings
                foreach ($validated['items'] as $itemData) {
                    if (!empty($itemData['service_id'])) {
                        $service = Service::with(['parts', 'materials'])->find($itemData['service_id']);
                        
                        // Map specific car parts to the job card
                        foreach ($service->parts as $part) {
                            JobCardItem::create([
                                'job_card_id' => $jobCard->id,
                                'service_id' => $service->id,
                                'part_id' => $part->id,
                                'status' => 'Pending',
                            ]);
                        }

                        // Map expected materials to the job card
                        foreach ($service->materials as $mat) {
                            JobCardMaterialUsage::create([
                                'job_card_id' => $jobCard->id,
                                'product_id' => $mat->product_id,
                                'spent_qty' => $mat->quantity * $itemData['qty'], // Suggested qty * service qty
                                'actual_qty' => 0,
                                'unit' => $mat->unit ?? 'm', 
                            ]);
                        }
                    }
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
