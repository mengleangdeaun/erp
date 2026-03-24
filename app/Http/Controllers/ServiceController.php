<?php

namespace App\Http\Controllers;

use App\Models\Service;
use App\Models\ServiceMaterial;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ServiceController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = Service::with(['category', 'materials.product', 'parts']);

        if ($request->has('branch_id')) {
            $branchId = $request->branch_id;
            $query->whereExists(function ($q) use ($branchId) {
                $q->select(DB::raw(1))
                    ->from('branch_service')
                    ->whereColumn('branch_service.service_id', 'services.id')
                    ->where('branch_service.branch_id', $branchId)
                    ->where('branch_service.is_active', true);
            });
        }

        return $query->select(['id', 'name', 'code', 'base_price', 'category_id', 'is_active'])
                     ->get();
}

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'required|string|unique:services,code',
            'base_price' => 'numeric',
            'description' => 'nullable|string',
            'category_id' => 'nullable|exists:inventory_categories,id',
            'is_active' => 'boolean',
            'materials' => 'array',
            'materials.*.product_id' => 'exists:inventory_products,id',
            'materials.*.suggested_qty' => 'numeric',
            'parts' => 'array',
            'parts.*' => 'exists:job_parts_master,id'
        ]);

        return DB::transaction(function () use ($validated) {
            $service = Service::create($validated);

            if (isset($validated['materials'])) {
                $uniqueMaterials = collect($validated['materials'])->unique('product_id');
                foreach ($uniqueMaterials as $mat) {
                    $service->materials()->create($mat);
                }
            }

            if (isset($validated['parts'])) {
                $service->parts()->sync($validated['parts']);
            }

            return $service->load(['category', 'materials.product', 'parts']);
        });
    }

    /**
     * Display the specified resource.
     */
    public function show(Service $list)
    {
        return $list->load(['category', 'materials.product', 'parts']);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Service $list)
    {
        $validated = $request->validate([
            'name' => 'string|max:255',
            'code' => 'string|unique:services,code,' . $list->id,
            'base_price' => 'numeric',
            'description' => 'nullable|string',
            'category_id' => 'nullable|exists:inventory_categories,id',
            'is_active' => 'boolean',
            'materials' => 'array',
            'materials.*.product_id' => 'exists:inventory_products,id',
            'materials.*.suggested_qty' => 'numeric',
            'parts' => 'array',
            'parts.*' => 'exists:job_parts_master,id'
        ]);

        return DB::transaction(function () use ($validated, $list) {
            $list->update($validated);

            if (isset($validated['materials'])) {
                $list->materials()->delete();
                $uniqueMaterials = collect($validated['materials'])->unique('product_id');
                foreach ($uniqueMaterials as $mat) {
                    $list->materials()->create($mat);
                }
            }

            if (isset($validated['parts'])) {
                $list->parts()->sync($validated['parts']);
            }

            return $list->load(['category', 'materials.product', 'parts']);
        });
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Service $list)
    {
        $list->delete();
        return response()->json(null, 204);
    }
}
