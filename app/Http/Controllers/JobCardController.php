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
        
        $validated = $request->validate([
            'technician_id' => 'sometimes|nullable|exists:employees,id',
            'status' => 'sometimes|in:Pending,In Progress,Completed,On Hold,Cancelled',
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

    public function complete($id)
    {
        $jobCard = JobCard::with(['materialUsage.serial', 'order'])->findOrFail($id);
        
        DB::transaction(function() use ($jobCard) {
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
                    $usage->serial->decrement('current_quantity', $qty);
                    if ($usage->serial->current_quantity <= 0) {
                        $usage->serial->update(['status' => 'Empty']);
                    }
                }

                // 2. Deduct from General Stock
                $stock = \App\Models\Inventory\InventoryStock::where('product_id', $usage->product_id)
                    ->where('branch_id', $jobCard->branch_id ?? $jobCard->order->branch_id)
                    ->first();
                
                if ($stock) {
                    $stock->decrement('quantity', $qty);
                }

                // 3. Record Stock Movement
                \App\Models\Inventory\InventoryStockMovement::create([
                    'product_id' => $usage->product_id,
                    'location_id' => $stock ? $stock->location_id : null,
                    'reference_type' => 'Job Card',
                    'reference_id' => $jobCard->id,
                    'type' => 'Out',
                    'quantity' => $qty,
                    'notes' => 'Consumed in Job Card #' . $jobCard->job_no
                ]);
            }

            // Update associated Sales Order if needed
            if ($jobCard->order && $jobCard->order->status !== 'Completed') {
                $jobCard->order->update(['status' => 'Service Completed']);
            }
        });

        return response()->json(['message' => 'Job Card completed successfully']);
    }
}
