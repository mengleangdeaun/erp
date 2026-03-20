<?php

namespace App\Http\Controllers\HR;

use App\Http\Controllers\Controller;
use App\Models\HR\Branch;
use App\Models\Inventory\InventoryProduct;
use Illuminate\Http\Request;

class BranchProductController extends Controller
{
    /**
     * Display a listing of products with assignment status for a branch.
     */
    public function index($branchId)
    {
        $branch = Branch::findOrFail($branchId);
        
        // Return all products with their assignment status
        $products = InventoryProduct::select('id', 'name', 'sku', 'code', 'price')
            ->with(['branches' => function ($query) use ($branchId) {
                $query->where('branch_id', $branchId);
            }])
            ->get()
            ->map(function ($product) {
                return [
                    'id' => $product->id,
                    'name' => $product->name,
                    'sku' => $product->sku,
                    'code' => $product->code,
                    'price' => $product->price,
                    'is_assigned' => $product->branches->isNotEmpty(),
                ];
            });

        return response()->json($products);
    }

    /**
     * Sync products for a branch.
     */
    public function sync(Request $request, $branchId)
    {
        $branch = Branch::findOrFail($branchId);
        
        $request->validate([
            'products' => 'required|array',
            'products.*' => 'exists:inventory_products,id'
        ]);

        $branch->inventoryProducts()->sync($request->products);

        return response()->json([
            'message' => 'Branch products updated successfully',
        ]);
    }
}
