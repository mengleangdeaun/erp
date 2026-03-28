<?php

namespace App\Http\Controllers;

use App\Models\JobCard;
use App\Models\JobCardItem;
use App\Models\JobCardMaterialUsage;
use App\Events\JobCardUpdated;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class JobCardController extends Controller
{
    public function index(Request $request)
    {
        $query = JobCard::with([
                'order', 
                'branch',
                'customer', 
                'vehicle.brand', 
                'vehicle.model', 
                'items.service', 
                'items.part', 
                'items.technicians',
                'replacementType',
                'leadTechnician'
            ])
            ->withCount('replacements');

        if ($request->status) {
            $query->where('status', $request->status);
        }

        if ($request->type) {
            $query->where('type', $request->type);
        }

        if ($request->branch_id) {
            $query->where('branch_id', $request->branch_id);
        }

        if ($request->from_date && $request->to_date) {
            $query->whereBetween('created_at', [$request->from_date . ' 00:00:00', $request->to_date . ' 23:59:59']);
        }

        if ($request->search) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('job_no', 'like', "%{$search}%")
                  ->orWhereHas('customer', function($cq) use ($search) {
                      $cq->where('name', 'like', "%{$search}%");
                  })
                  ->orWhereHas('vehicle', function($vq) use ($search) {
                      $vq->where('plate_number', 'like', "%{$search}%");
                  });
            });
        }

        return $query->latest()->get();
    }

    public function show($id)
    {
        return JobCard::with([
            'order.items.itemable', 
            'branch',
            'customer', 
            'vehicle.brand', 
            'vehicle.model', 
            'items.service', 
            'items.part', 
            'items.technicians',
            'materialUsage.product',
            'parent',
            'replacements',
            'replacementType',
            'leadTechnician'
        ])->findOrFail($id);
    }

    public function update(Request $request, $id)
    {
        $jobCard = JobCard::findOrFail($id);
        
        $validated = $request->validate([
            'status' => 'sometimes|string',
            'notes' => 'sometimes|nullable|string',
            'technician_lead_id' => 'sometimes|nullable|exists:employees,id',
        ]);

        if (isset($validated['status'])) {
            // Logic for status transitions if needed
            if ($validated['status'] === 'Delivered' && !$jobCard->completed_at) {
                $validated['completed_at'] = now();
            }
        }

        $jobCard->update($validated);

        // Broadcast the update
        event(new JobCardUpdated($jobCard->id));

        return $jobCard->load(['customer', 'vehicle', 'leadTechnician']);
    }

    public function updateItem(Request $request, $itemId)
    {
        $item = JobCardItem::findOrFail($itemId);
        
        // Normalize status strings
        if ($request->has('status')) {
            $status = $request->status;
            $normalized = match(strtolower(str_replace(['_', '-'], ' ', $status))) {
                'pending' => 'Pending',
                'assigned' => 'Assigned',
                'in progress' => 'In Progress',
                'completed' => 'Completed',
                'on hold' => 'On Hold',
                'cancelled' => 'Cancelled',
                'reworking' => 'Reworking',
                default => $status
            };
            $request->merge(['status' => $normalized]);
        }

        $validated = $request->validate([
            'technician_id' => 'sometimes|nullable|exists:employees,id', // Legacy support
            'technician_ids' => 'sometimes|array', // Multiple techs
            'technician_ids.*' => 'exists:employees,id',
            'status' => ['sometimes', \Illuminate\Validation\Rule::in(['Pending', 'Assigned', 'In Progress', 'Completed', 'On Hold', 'Cancelled', 'Reworking'])],
            'notes' => 'nullable|string',
            'completion_percentage' => 'nullable|integer|min:0|max:100',
            'started_at' => 'nullable|date',
            'completed_at' => 'nullable|date',
        ]);

        if (isset($validated['status'])) {
            if ($validated['status'] === 'In Progress' && !$item->started_at) {
                $validated['started_at'] = now();
            }
            if ($validated['status'] === 'Completed') {
                if (!$item->completed_at) {
                    $validated['completed_at'] = now();
                }
                $validated['completion_percentage'] = 100;
            }
        }

        $item->update($validated);

        // Sync multiple technicians if provided
        if (isset($validated['technician_ids'])) {
            $item->technicians()->sync($validated['technician_ids']);
        }

        // Auto update Job Card status and timestamps
        $jobCard = $item->jobCard;
        if ($jobCard->items()->where('status', '!=', 'Completed')->count() === 0) {
            $jobCard->update([
                'status' => 'QC Review', 
                'completed_at' => $jobCard->completed_at ?: now()
            ]);
        } else {
            // Check if any item is started
            if ($hasStarted && $jobCard->status === 'Pending') {
                $jobCard->update([
                    'status' => 'In Progress'
                ]);
            }
        }

        $item->load(['technicians', 'part', 'service']);

        // Broadcast the update to all connected clients
        event(new JobCardUpdated($jobCard->id));

        return $item;
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
                'status' => 'Delivered',
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

                // 2. Record Movement and Deduct Stock
                $branchId = $jobCard->branch_id ?? $jobCard->order->branch_id;

                if ($usage->serial) {
                   // Serialized Item: Log movement but DON'T deduct from general stock (already handled via decrement above)
                   // We use the serial's physical location for the movement record
                   \App\Models\Inventory\InventoryStockMovement::create([
                        'product_id' => $usage->product_id,
                        'location_id' => $usage->serial->location_id,
                        'serial_id' => $usage->serial_id,
                        'user_id' => auth()->id(),
                        'movement_type' => 'JOB_CARD_CONSUMPTION',
                        'quantity' => -$qty,
                        'previous_quantity' => $usage->serial->current_quantity + $qty,
                        'current_quantity' => $usage->serial->current_quantity,
                        'reference_type' => 'Job Card',
                        'reference_id' => $jobCard->id,
                        'reason' => 'Consumed in Job Card #' . $jobCard->job_no . ' (Serial: ' . $usage->serial->serial_number . ')'
                    ]);
                } else {
                    // Bulk Item: Deduct using automated branch fallback
                    $stockService->deductFromBranch(
                        $usage->product_id,
                        $branchId,
                        $qty,
                        'JOB_CARD_CONSUMPTION',
                        $jobCard,
                        'Consumed in Job Card #' . $jobCard->job_no
                    );
                }
            }

            // Update associated Sales Order if needed
            if ($jobCard->order && $jobCard->order->status !== 'Completed') {
                $jobCard->order->update(['status' => 'Service Completed']);
            }
        });

        return response()->json(['message' => 'Job Card delivered successfully']);
    }

    public function createReplacement(Request $request, $id)
    {
        $original = JobCard::findOrFail($id);

        $validated = $request->validate([
            'replacement_type_id' => 'required|exists:job_card_replacement_types,id',
            'notes' => 'nullable|string',
            'items' => 'required|array',
            'items.*.service_id' => 'required|exists:services,id',
            'items.*.part_id' => 'required|exists:job_parts_master,id',
        ]);

        return DB::transaction(function() use ($original, $validated) {
            // Generate next job number
            $lastJob = JobCard::latest('id')->first();
            $nextId = ($lastJob ? $lastJob->id : 0) + 1;
            $jobNo = 'JOB-' . date('Ymd') . '-' . str_pad($nextId, 4, '0', STR_PAD_LEFT);

            $replacement = JobCard::create([
                'job_no' => $jobNo,
                'sales_order_id' => $original->sales_order_id,
                'branch_id' => $original->branch_id,
                'customer_id' => $original->customer_id,
                'vehicle_id' => $original->vehicle_id,
                'mileage_in' => $original->mileage_in,
                'status' => 'Pending',
                'type' => 'replacement',
                'parent_id' => $original->id,
                'replacement_type_id' => $validated['replacement_type_id'],
                'notes' => $validated['notes']
            ]);

            foreach ($validated['items'] as $item) {
                JobCardItem::create([
                    'job_card_id' => $replacement->id,
                    'service_id' => $item['service_id'],
                    'part_id' => $item['part_id'],
                    'status' => 'Pending',
                    'completion_percentage' => 0
                ]);
            }

            return $replacement->load(['items.part', 'items.service', 'replacementType']);
        });
    }
}
