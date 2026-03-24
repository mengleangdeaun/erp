<?php

namespace App\Http\Controllers\Inventory;

use App\Http\Controllers\Controller;
use App\Models\Inventory\InventoryProduct;
use App\Models\Inventory\InventoryStock;
use App\Models\Inventory\InventoryStockMovement;
use App\Models\Inventory\InventoryProductSerial;
use App\Models\HR\Branch;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class InventoryDashboardController extends Controller
{
    public function index(Request $request)
    {
        $branchId = $request->query('branch_id');

        // 1. Overview Stats
        $productQuery = InventoryProduct::query();
        if ($branchId) {
            $productQuery->whereHas('branches', function($q) use ($branchId) {
                $q->where('branch_id', $branchId);
            });
        }
        $totalProducts = $productQuery->count();
        $activeProducts = (clone $productQuery)->where('is_active', true)->count();
        
        // Total Stock Value (quantity * product cost)
        $stockValueQuery = InventoryStock::join('inventory_products', 'inventory_stocks.product_id', '=', 'inventory_products.id')
            ->join('inventory_locations', 'inventory_stocks.location_id', '=', 'inventory_locations.id')
            ->join('branches', 'inventory_locations.branch_id', '=', 'branches.id');
            
        if ($branchId) {
            $stockValueQuery->where('branches.id', $branchId);
        } else {
            $stockValueQuery->where('branches.status', 'active');
        }
        $totalStockValue = $stockValueQuery->select(DB::raw('SUM(inventory_stocks.quantity * inventory_products.cost) as total_value'))
            ->value('total_value') ?? 0;

        // Low Stock Count
        if ($branchId) {
            $lowStockCount = InventoryProduct::whereHas('branches', function($q) use ($branchId) {
                    $q->where('branch_id', $branchId);
                })
                ->whereRaw('
                    COALESCE((SELECT SUM(quantity) 
                     FROM inventory_stocks 
                     JOIN inventory_locations ON inventory_stocks.location_id = inventory_locations.id 
                     WHERE inventory_stocks.product_id = inventory_products.id 
                     AND inventory_locations.branch_id = ?), 0)
                    < COALESCE(
                        (SELECT reorder_level 
                         FROM branch_inventory_product 
                         WHERE branch_id = ? AND inventory_product_id = inventory_products.id),
                        inventory_products.reorder_level
                    )
                ', [$branchId, $branchId])
                ->count();
        } else {
            $lowStockCount = InventoryProduct::whereRaw('
                COALESCE((SELECT SUM(quantity) 
                 FROM inventory_stocks 
                 JOIN inventory_locations ON inventory_stocks.location_id = inventory_locations.id 
                 JOIN branches ON inventory_locations.branch_id = branches.id
                 WHERE inventory_stocks.product_id = inventory_products.id
                 AND branches.status = ?), 0) 
                < reorder_level
            ', ['active'])->count();
        }

        // 2. Stock Distribution
        if ($branchId) {
            $distribution = \App\Models\Inventory\InventoryLocation::where('branch_id', $branchId)
                ->with('stocks')
                ->get()
                ->map(function ($location) {
                    return [
                        'name' => $location->name,
                        'quantity' => $location->stocks->sum('quantity')
                    ];
                });
            $distributionTitle = "Stock by Location";
        } else {
            $distribution = Branch::where('status', 'active')
                ->with(['locations.stocks'])
                ->get()
                ->map(function ($branch) {
                    $totalQuantity = $branch->locations->flatMap->stocks->sum('quantity');
                    return [
                        'name' => $branch->name,
                        'quantity' => $totalQuantity
                    ];
                });
            $distributionTitle = "Stock by Branch";
        }

        // 3. Category Distribution
        $categoryDistribution = DB::table('inventory_categories')
            ->leftJoin('inventory_products', 'inventory_categories.id', '=', 'inventory_products.category_id')
            ->leftJoin('inventory_stocks', function($join) use ($branchId) {
                $join->on('inventory_products.id', '=', 'inventory_stocks.product_id')
                     ->join('inventory_locations', 'inventory_stocks.location_id', '=', 'inventory_locations.id')
                     ->join('branches', 'inventory_locations.branch_id', '=', 'branches.id');
                     
                if ($branchId) {
                    $join->where('branches.id', '=', $branchId);
                } else {
                    $join->where('branches.status', '=', 'active');
                }
            })
            ->select('inventory_categories.name', DB::raw('SUM(COALESCE(inventory_stocks.quantity, 0)) as total_quantity'))
            ->groupBy('inventory_categories.id', 'inventory_categories.name')
            ->get();

        // 4. Recent Movements
        $movementQuery = InventoryStockMovement::with(['product', 'location.branch', 'user']);
        if ($branchId) {
            $movementQuery->whereHas('location', function($q) use ($branchId) {
                $q->where('branch_id', $branchId);
            });
        }
        $recentMovements = $movementQuery->orderBy('created_at', 'desc')->limit(10)->get();

        // 5. Serial Stats (Rolls)
        $serialQuery = InventoryProductSerial::query();
        if ($branchId) {
            $serialQuery->whereHas('location', function($q) use ($branchId) {
                $q->where('branch_id', $branchId);
            });
        }
        $totalRolls = (clone $serialQuery)->count();
        $availableRolls = (clone $serialQuery)->where('status', 'available')->count();
        $consumedRolls = (clone $serialQuery)->where('status', 'consumed')->count();
        
        // Consumption rate (Estimated based on last 30 days movements)
        $thirtyDaysAgo = now()->subDays(30);
        $consumptionQuery = InventoryStockMovement::where('movement_type', 'out')
            ->where('created_at', '>=', $thirtyDaysAgo);
        if ($branchId) {
            $consumptionQuery->whereHas('location', function($q) use ($branchId) {
                $q->where('branch_id', $branchId);
            });
        }
        $consumptionLastMonth = $consumptionQuery->sum('quantity');

        return response()->json([
            'overview' => [
                'total_products' => $totalProducts,
                'active_products' => $activeProducts,
                'total_stock_value' => (float)$totalStockValue,
                'low_stock_count' => $lowStockCount,
            ],
            'distribution' => [
                'title' => $distributionTitle,
                'data' => $distribution
            ],
            'category_distribution' => $categoryDistribution,
            'recent_movements' => $recentMovements,
            'serial_stats' => [
                'total_rolls' => $totalRolls,
                'available_rolls' => $availableRolls,
                'consumed_rolls' => $consumedRolls,
                'monthly_consumption' => (float)$consumptionLastMonth,
            ]
        ]);
    }
}
