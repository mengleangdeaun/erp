<?php

namespace App\Http\Controllers\Inventory;

use App\Http\Controllers\Controller;
use App\Models\Inventory\InventoryProduct;
use Illuminate\Http\Request;

class ProductController extends Controller
{
    public function index(Request $request)
    {
        $query = InventoryProduct::with(['category', 'baseUom', 'purchaseUom', 'tags', 'stocks.location'])
            ->where('is_active', true);

        if ($request->has('branch_id')) {
            $branchId = $request->branch_id;
            $query->whereExists(function ($query) use ($branchId) {
                $query->select(\Illuminate\Support\Facades\DB::raw(1))
                    ->from('branch_inventory_product')
                    ->whereColumn('branch_inventory_product.inventory_product_id', 'inventory_products.id')
                    ->where('branch_inventory_product.branch_id', $branchId)
                    ->where('branch_inventory_product.is_active', true);
            });

            $query->addSelect([
                'inventory_products.*',
                'branch_stock_qty' => \App\Models\Inventory\InventoryStock::select(\Illuminate\Support\Facades\DB::raw('SUM(quantity)'))
                    ->join('inventory_locations', 'inventory_locations.id', '=', 'inventory_stocks.location_id')
                    ->where('inventory_locations.branch_id', $branchId)
                    ->where('inventory_locations.is_active', true)
                    ->whereColumn('inventory_stocks.product_id', 'inventory_products.id')
            ]);
        }

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('code', 'like', "%{$search}%")
                  ->orWhere('sku', 'like', "%{$search}%");
            });
        }

        if ($request->has('category_id')) {
            $query->where('category_id', $request->category_id);
        }

        if ($request->has('all') || $request->paginate === 'false') {
            return response()->json($query->orderBy('name')->get());
        }

        return response()->json($query->orderBy('name')->paginate($request->per_page ?? 24));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'code' => 'required|string|unique:inventory_products,code',
            'sku' => 'nullable|string|unique:inventory_products,sku',
            'barcode' => 'nullable|string|unique:inventory_products,barcode',
            'category_id' => 'nullable|exists:inventory_categories,id',
            'base_uom_id' => 'nullable|exists:inventory_uoms,id',
            'purchase_uom_id' => 'nullable|exists:inventory_uoms,id',
            'uom_multiplier' => 'numeric',
            'length' => 'nullable|numeric',
            'width' => 'nullable|numeric',
            'brand' => 'nullable|string',
            'name' => 'required|string',
            'description' => 'nullable|string',
            'cost' => 'numeric',
            'price' => 'numeric',
            'reorder_level' => 'integer',
            'is_active' => 'boolean',
            'img' => 'nullable',
            'tags' => 'nullable|array',
            'tags.*' => 'exists:inventory_tags,id'
        ]);

        // Handle Image upload dynamically if sent
        $imageService = new \App\Services\ImageService();
        if ($request->hasFile('img')) {
            $path = $imageService->compressToWebp($request->file('img'));
            if ($path) {
                $validated['img'] = '/storage/' . $path;
            }
        } elseif ($request->img) {
            $validated['img'] = $request->img;
        }

        $product = InventoryProduct::create($validated);
        
        if (isset($validated['tags'])) {
            $product->tags()->sync($validated['tags']);
        }

        return response()->json($product->load(['category', 'baseUom', 'purchaseUom', 'tags']), 201);
    }

    public function show($id)
    {
        return response()->json(InventoryProduct::with(['category', 'baseUom', 'purchaseUom', 'tags', 'stocks.location'])->findOrFail($id));
    }

    public function update(Request $request, $id)
    {
        $product = InventoryProduct::findOrFail($id);

        $validated = $request->validate([
            'code' => 'sometimes|required|string|unique:inventory_products,code,' . $product->id,
            'sku' => 'nullable|string|unique:inventory_products,sku,' . $product->id,
            'barcode' => 'nullable|string|unique:inventory_products,barcode,' . $product->id,
            'category_id' => 'nullable|exists:inventory_categories,id',
            'base_uom_id' => 'nullable|exists:inventory_uoms,id',
            'purchase_uom_id' => 'nullable|exists:inventory_uoms,id',
            'uom_multiplier' => 'numeric',
            'length' => 'nullable|numeric',
            'width' => 'nullable|numeric',
            'brand' => 'nullable|string',
            'name' => 'sometimes|required|string',
            'description' => 'nullable|string',
            'cost' => 'numeric',
            'price' => 'numeric',
            'reorder_level' => 'integer',
            'is_active' => 'boolean',
            'img' => 'nullable',
            'tags' => 'nullable|array',
            'tags.*' => 'exists:inventory_tags,id'
        ]);

        $imageService = new \App\Services\ImageService();
        if ($request->hasFile('img')) {
            $path = $imageService->compressToWebp($request->file('img'));
            if ($path) {
                $validated['img'] = '/storage/' . $path;
            }
        } elseif ($request->img) {
            $validated['img'] = $request->img;
        }

        $product->update($validated);

        if (isset($validated['tags'])) {
            $product->tags()->sync($validated['tags']);
        }

        return response()->json($product->load(['category', 'baseUom', 'purchaseUom', 'tags']));
    }

    public function destroy($id)
    {
        InventoryProduct::findOrFail($id)->delete();
        return response()->json(['message' => 'Product deleted successfully']);
    }
}
