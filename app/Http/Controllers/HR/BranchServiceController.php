<?php

namespace App\Http\Controllers\HR;

use App\Http\Controllers\Controller;
use App\Models\HR\Branch;
use App\Models\Service;
use Illuminate\Http\Request;

class BranchServiceController extends Controller
{
    /**
     * Display a listing of services with assignment status for a branch.
     */
    public function index($branchId)
    {
        $branch = Branch::findOrFail($branchId);
        
        // Return all services with their assignment status
        $services = Service::select('id', 'name', 'code', 'base_price')
            ->with(['branches' => function ($query) use ($branchId) {
                $query->where('branch_id', $branchId);
            }])
            ->get()
            ->map(function ($service) {
                return [
                    'id' => $service->id,
                    'name' => $service->name,
                    'code' => $service->code,
                    'base_price' => $service->base_price,
                    'is_assigned' => $service->branches->isNotEmpty(),
                ];
            });

        return response()->json($services);
    }

    /**
     * Sync services for a branch.
     */
    public function sync(Request $request, $branchId)
    {
        $branch = Branch::findOrFail($branchId);
        
        $request->validate([
            'services' => 'required|array',
            'services.*' => 'exists:services,id'
        ]);

        $branch->services()->sync($request->services);

        return response()->json([
            'message' => 'Branch services updated successfully',
        ]);
    }
}
