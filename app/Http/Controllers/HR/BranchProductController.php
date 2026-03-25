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
        
        // Return all products with their assignment status and branch-specific stock
        $products = InventoryProduct::select('id', 'name', 'sku', 'code', 'price', 'length', 'width')
            ->addSelect([
                'bulk_stock_qty' => \App\Models\Inventory\InventoryStock::select(\Illuminate\Support\Facades\DB::raw('COALESCE(SUM(quantity), 0)'))
                    ->join('inventory_locations', 'inventory_locations.id', '=', 'inventory_stocks.location_id')
                    ->where('inventory_locations.branch_id', $branchId)
                    ->where('inventory_locations.is_active', true)
                    ->whereColumn('inventory_stocks.product_id', 'inventory_products.id'),
                'serial_stock_count' => \App\Models\Inventory\InventoryProductSerial::select(\Illuminate\Support\Facades\DB::raw('COUNT(*)'))
                    ->where('branch_id', $branchId)
                    ->where('status', 'Available')
                    ->whereColumn('product_id', 'inventory_products.id'),
                'serial_total_sqm' => \App\Models\Inventory\InventoryProductSerial::select(\Illuminate\Support\Facades\DB::raw('COALESCE(SUM(current_quantity), 0)'))
                    ->where('branch_id', $branchId)
                    ->where('status', 'Available')
                    ->whereColumn('product_id', 'inventory_products.id'),
                'serial_initial_sqm' => \App\Models\Inventory\InventoryProductSerial::select(\Illuminate\Support\Facades\DB::raw('COALESCE(SUM(initial_quantity), 0)'))
                    ->where('branch_id', $branchId)
                    ->where('status', 'Available')
                    ->whereColumn('product_id', 'inventory_products.id')
            ])
            ->with([
                'branches' => function ($query) use ($branchId) {
                    $query->where('branch_id', $branchId);
                },
                'serials' => function ($query) use ($branchId) {
                    $query->where('branch_id', $branchId)
                          ->where('status', 'Available')
                          ->select('id', 'product_id', 'serial_number', 'current_quantity', 'initial_quantity', 'width', 'length');
                },
                'stocks' => function ($query) use ($branchId) {
                    $query->join('inventory_locations', 'inventory_locations.id', '=', 'inventory_stocks.location_id')
                          ->where('inventory_locations.branch_id', $branchId)
                          ->select('inventory_stocks.*');
                }
            ])
            ->get()
            ->map(function ($product) {
                $pivot = $product->branches->first()?->pivot;
                return [
                    'id' => $product->id,
                    'name' => $product->name,
                    'sku' => $product->sku,
                    'code' => $product->code,
                    'price' => $product->price,
                    'is_assigned' => $product->branches->isNotEmpty(),
                    'reorder_level' => $pivot ? $pivot->reorder_level : 0,
                    'branch_stock_qty' => (int)($product->bulk_stock_qty ?? 0) + (int)($product->serial_stock_count ?? 0),
                    'bulk_stock_qty' => (int)($product->bulk_stock_qty ?? 0),
                    'serial_stock_count' => (int)($product->serial_stock_count ?? 0),
                    'serial_total_sqm' => (float)($product->serial_total_sqm ?? 0),
                    'serial_initial_sqm' => (float)($product->serial_initial_sqm ?? 0),
                    'length' => (float)($product->length ?? 0),
                    'width' => (float)($product->width ?? 0),
                    'location_stocks' => $product->stocks->pluck('quantity', 'location_id'),
                    'available_serials' => $product->serials->map(function ($serial) {
                        return [
                            'id' => $serial->id,
                            'serial_number' => $serial->serial_number,
                            'current_quantity' => (float)$serial->current_quantity,
                            'initial_quantity' => (float)$serial->initial_quantity,
                            'percentage' => $serial->initial_quantity > 0 ? ($serial->current_quantity / $serial->initial_quantity) * 100 : 0
                        ];
                    })
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
            'products.*.id' => 'required|exists:inventory_products,id',
            'products.*.reorder_level' => 'nullable|integer|min:0'
        ]);

        $syncData = [];
        foreach ($request->products as $item) {
            $syncData[$item['id']] = ['reorder_level' => $item['reorder_level'] ?? 0];
        }

        $branch->inventoryProducts()->sync($syncData);

        return response()->json([
            'message' => 'Branch products updated successfully',
        ]);
    }
}
