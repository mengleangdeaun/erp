<?php

namespace App\Http\Controllers\Inventory;

use App\Http\Controllers\Controller;
use App\Models\Inventory\InventoryProduct;
use Illuminate\Http\Request;

class StockBalanceController extends Controller
{
    /**
     * Display a listing of products with aggregated stock levels.
     */
    public function index(Request $request)
    {
        $branchId = $request->input('branch_id');
        $locationId = $request->input('location_id');

        $products = InventoryProduct::select('id', 'name', 'code', 'sku')
            ->with([
                'stocks' => function($query) use ($branchId, $locationId) {
                    if ($branchId) {
                        $query->whereHas('location', function($q) use ($branchId) {
                            $q->where('branch_id', $branchId);
                        });
                    }
                    if ($locationId) {
                        $query->where('location_id', $locationId);
                    }
                    $query->with('location.branch');
                },
                'serials' => function($query) use ($branchId, $locationId) {
                    $query->where('status', 'Available');
                    if ($branchId) {
                        $query->where('branch_id', $branchId);
                    }
                    if ($locationId) {
                        $query->where('location_id', $locationId);
                    }
                    $query->with(['location', 'branch']);
                }
            ])
            ->get()
            ->map(function ($product) {
                $totalBulkQty = $product->stocks->sum('quantity');
                $totalSerialQty = $product->serials->count();
                
                // Group by branch
                $branches = [];
                
                // 1. Process Bulk Stocks
                foreach ($product->stocks as $stock) {
                    $branchId = $stock->location->branch_id;
                    $branchName = $stock->location->branch->name;
                    $locationId = $stock->location_id;
                    $locationName = $stock->location->name;
                    
                    if (!isset($branches[$branchId])) {
                        $branches[$branchId] = [
                            'id' => $branchId,
                            'name' => $branchName,
                            'bulk_qty' => 0,
                            'serial_qty' => 0,
                            'locations' => []
                        ];
                    }
                    
                    $branches[$branchId]['bulk_qty'] += $stock->quantity;
                    
                    if (!isset($branches[$branchId]['locations'][$locationId])) {
                        $branches[$branchId]['locations'][$locationId] = [
                            'id' => $locationId,
                            'name' => $locationName,
                            'bulk_qty' => 0,
                            'serial_qty' => 0
                        ];
                    }
                    $branches[$branchId]['locations'][$locationId]['bulk_qty'] += $stock->quantity;
                }
                
                // 2. Process Serials
                foreach ($product->serials as $serial) {
                    $branchId = $serial->branch_id;
                    if (!$branchId) continue;
                    
                    $branchName = $serial->branch?->name ?: 'Unknown Branch';
                    $locationId = $serial->location_id;
                    $locationName = $serial->location?->name ?: 'Unassigned Location';
                    
                    if (!isset($branches[$branchId])) {
                        $branches[$branchId] = [
                            'id' => $branchId,
                            'name' => $branchName,
                            'bulk_qty' => 0,
                            'serial_qty' => 0,
                            'locations' => []
                        ];
                    }
                    
                    $branches[$branchId]['serial_qty'] += 1;
                    
                    if ($locationId) {
                         if (!isset($branches[$branchId]['locations'][$locationId])) {
                            $branches[$branchId]['locations'][$locationId] = [
                                'id' => $locationId,
                                'name' => $locationName,
                                'bulk_qty' => 0,
                                'serial_qty' => 0
                            ];
                        }
                        $branches[$branchId]['locations'][$locationId]['serial_qty'] += 1;
                    }
                }

                // Convert locations object to array for each branch
                foreach ($branches as $bid => $b) {
                    $branches[$bid]['locations'] = array_values($b['locations']);
                }

                return [
                    'id' => $product->id,
                    'name' => $product->name,
                    'code' => $product->code,
                    'sku' => $product->sku,
                    'total_bulk_qty' => (float)$totalBulkQty,
                    'total_serial_qty' => (int)$totalSerialQty,
                    'total_stock' => (float)($totalBulkQty + $totalSerialQty),
                    'branches' => array_values($branches),
                    'serials' => $product->serials->toArray(),
                ];
            });

        return response()->json($products);
    }
}
