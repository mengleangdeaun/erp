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
            'order.items.product', 
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
            'actual_qty' => 'required|numeric',
            'notes' => 'nullable|string',
        ]);

        $usage->update($validated);
        return $usage;
    }

    public function complete($id)
    {
        $jobCard = JobCard::findOrFail($id);
        
        DB::transaction(function() use ($jobCard) {
            $jobCard->update([
                'status' => 'Completed',
                'completed_at' => now()
            ]);

            // Update associated Sales Order if needed
            if ($jobCard->order && $jobCard->order->status !== 'Completed') {
                $jobCard->order->update(['status' => 'Service Completed']);
            }
        });

        return response()->json(['message' => 'Job Card completed successfully']);
    }
}
