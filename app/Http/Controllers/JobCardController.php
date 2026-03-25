<?php

namespace App\Http\Controllers;

use App\Models\JobCard;
use App\Models\JobCardItem;
use App\Models\JobCardMaterialUsage;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class JobCardController extends Controller
{
    public function index(Request $request)
    {
        $query = JobCard::with(['order', 'customer', 'vehicle.brand', 'vehicle.model', 'items.service', 'items.part', 'items.technician']);

        if ($request->status) {
            $query->where('status', $request->status);
        }

        if ($request->search) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('job_no', 'like', "%{$search}%")
                  ->orWhereHas('customer', function($cq) use ($search) {
                      $cq->where('name', 'like', "%{$search}%");
                  });
            });
        }

        return $query->latest()->get();
    }

    public function show($id)
    {
        return JobCard::with([
            'order.items.itemable', 
            'customer', 
            'vehicle.brand', 
            'vehicle.model', 
            'items.service', 
            'items.part', 
            'items.technician',
            'materialUsage.product'
        ])->findOrFail($id);
    }

    public function updateItem(Request $request, $itemId)
    {
        $item = JobCardItem::findOrFail($itemId);
        
        // Normalize status strings
        if ($request->has('status')) {
            $status = $request->status;
            $normalized = match(strtolower(str_replace(['_', '-'], ' ', $status))) {
                'pending' => 'Pending',
                'in progress' => 'In Progress',
                'completed' => 'Completed',
                'on hold' => 'On Hold',
                'cancelled' => 'Cancelled',
                default => $status
            };
            $request->merge(['status' => $normalized]);
        }

        $validated = $request->validate([
            'technician_id' => 'sometimes|nullable|exists:employees,id',
            'status' => ['sometimes', \Illuminate\Validation\Rule::in(['Pending', 'In Progress', 'Completed', 'On Hold', 'Cancelled'])],
            'notes' => 'nullable|string',
            'completion_percentage' => 'nullable|integer|min:0|max:100',
            'started_at' => 'nullable|date',
            'completed_at' => 'nullable|date',
        ]);

        if (isset($validated['status'])) {
            if ($validated['status'] === 'In Progress' && !$item->started_at) {
                $validated['started_at'] = now();
            }
            if ($validated['status'] === 'Completed' && !$item->completed_at) {
                $validated['completed_at'] = now();
            }
        }

        $item->update($validated);
        
        // Auto update Job Card status if all items are completed
        $jobCard = $item->jobCard;
        if ($jobCard->items()->where('status', '!=', 'Completed')->count() === 0) {
            $jobCard->update(['status' => 'Testing', 'completed_at' => now()]);
        } elseif ($jobCard->status === 'Pending') {
            $jobCard->update(['status' => 'In Progress', 'started_at' => now()]);
        }

        return $item->load(['technician', 'part', 'service']);
    }

    public function updateMaterialUsage(Request $request, $usageId)
    {
        $usage = JobCardMaterialUsage::findOrFail($usageId);
        
        $validated = $request->validate([
            'spent_qty' => 'sometimes|numeric',
            'actual_qty' => 'sometimes|numeric',
            'serial_id' => 'sometimes|nullable|exists:inventory_product_serials,id',
            'width_on_car' => 'sometimes|nullable|numeric',
            'height_on_car' => 'sometimes|nullable|numeric',
            'width_cut' => 'sometimes|nullable|numeric',
            'height_cut' => 'sometimes|nullable|numeric',
            'notes' => 'nullable|string',
        ]);

        $usage->update($validated);
        return $usage->load('serial');
    }

    public function getAvailableSerials(Request $request, $productId)
    {
        $query = \App\Models\Inventory\InventoryProductSerial::where('product_id', $productId)
            ->where('status', 'Available');

        if ($request->branch_id) {
            $query->where('branch_id', $request->branch_id);
        }

        return $query->get();
    }

    public function complete($id, \App\Services\Inventory\StockService $stockService)
    {
        $jobCard = JobCard::with(['materialUsage.serial', 'order'])->findOrFail($id);
        
        DB::transaction(function() use ($jobCard, $stockService) {
            $jobCard->update([
                'status' => 'Completed',
                'completed_at' => now()
            ]);

            // Deduct Materials from Stock
            foreach ($jobCard->materialUsage as $usage) {
                $qty = $usage->actual_qty ?: $usage->spent_qty;
                if ($qty <= 0) continue;

                // 1. Deduct from Serial if present
                if ($usage->serial) {
                    $serial = $usage->serial;
                    $prevSerialQty = (float)$serial->current_quantity;
                    $serial->decrement('current_quantity', $qty);
                    
                    if ($serial->current_quantity <= 0) {
                        $serial->update(['status' => 'Empty']);
                    }

                    // Record Serial Movement
                    \App\Models\Inventory\InventorySerialMovement::create([
                        'serial_id' => $serial->id,
                        'product_id' => $usage->product_id,
                        'location_id' => $serial->location_id,
                        'user_id' => auth()->id(),
                        'movement_type' => 'JOB_CARD_CONSUMPTION',
                        'quantity' => -$qty,
                        'width' => $usage->width_cut,
                        'height' => $usage->height_cut,
                        'previous_quantity' => $prevSerialQty,
                        'current_quantity' => (float)$serial->current_quantity,
                        'reference_type' => 'Job Card',
                        'reference_id' => $jobCard->id,
                        'reason' => 'Consumed in Job Card #' . $jobCard->job_no
                    ]);
                }

                // 2. Record Movement
                $branchId = $jobCard->branch_id ?? $jobCard->order->branch_id;
                $location = \App\Models\Inventory\InventoryLocation::where('branch_id', $branchId)
                    ->where('is_primary', true)
                    ->first() ?? \App\Models\Inventory\InventoryLocation::where('branch_id', $branchId)->first();

                if ($location) {
                    if ($usage->serial) {
                        // Serialized Item: Log movement but DON'T deduct from general stock (roll count)
                        \App\Models\Inventory\InventoryStockMovement::create([
                            'product_id' => $usage->product_id,
                            'location_id' => $location->id,
                            'serial_id' => $usage->serial_id,
                            'user_id' => auth()->id(),
                            'movement_type' => 'JOB_CARD_CONSUMPTION',
                            'quantity' => -$qty,
                            'previous_quantity' => $usage->serial->current_quantity + $qty, // Reconstruct prev from current
                            'current_quantity' => $usage->serial->current_quantity,
                            'reference_type' => 'Job Card',
                            'reference_id' => $jobCard->id,
                            'reason' => 'Consumed in Job Card #' . $jobCard->job_no . ' (Serial: ' . $usage->serial->serial_number . ')'
                        ]);
                    } else {
                        // Bulk Item: Deduct from general stock as usual
                        $stockService->updateStock(
                            $usage->product_id,
                            $location->id,
                            -$qty,
                            'JOB_CARD_CONSUMPTION',
                            $jobCard,
                            'Consumed in Job Card #' . $jobCard->job_no
                        );
                    }
                } else {
                    \Log::warning("No location found for branch ID: {$branchId}. Skipping stock deduction for product: {$usage->product_id}");
                }
            }

            // Update associated Sales Order if needed
            if ($jobCard->order && $jobCard->order->status !== 'Completed') {
                $jobCard->order->update(['status' => 'Service Completed']);
            }
        });

        return response()->json(['message' => 'Job Card completed successfully']);
    }
}
