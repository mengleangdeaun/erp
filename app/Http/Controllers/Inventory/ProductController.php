<?php

namespace App\Http\Controllers\Inventory;

use App\Http\Controllers\Controller;
use App\Models\Inventory\InventoryProduct;
use Illuminate\Http\Request;

class ProductController extends Controller
{
    public function index()
    {
        return response()->json(InventoryProduct::with(['category', 'baseUom', 'purchaseUom', 'tags', 'stocks.location'])->orderBy('name')->get());
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
            'tags' => 'nullable|array',
            'tags.*' => 'exists:inventory_tags,id'
        ]);

        // Handle Image upload dynamically if sent
        if ($request->hasFile('img')) {
            $path = $request->file('img')->store('products', 'public');
            $validated['img'] = '/storage/' . $path;
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
            'tags' => 'nullable|array',
            'tags.*' => 'exists:inventory_tags,id'
        ]);

        if ($request->hasFile('img')) {
            $path = $request->file('img')->store('products', 'public');
            $validated['img'] = '/storage/' . $path;
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
