<?php

namespace App\Services\Inventory;

use App\Models\Inventory\InventoryStock;
use App\Models\Inventory\InventoryStockMovement;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class StockService
{
    /**
     * Update stock and log movement.
     *
     * @param int $productId
     * @param int $locationId
     * @param float $quantity The change in quantity (positive for IN, negative for OUT)
     * @param string $type The movement type (e.g., 'PURCHASE_RECEIVE')
     * @param mixed $reference The source model instance
     * @param string|null $reason
     * @param int|null $userId
     * @return InventoryStock
     */
    public function updateStock(int $productId, int $locationId, float $quantity, string $type, $reference = null, ?string $reason = null, ?int $userId = null, ?int $serialId = null)
    {
        return DB::transaction(function () use ($productId, $locationId, $quantity, $type, $reference, $reason, $userId, $serialId) {
            // 1. Get current stock
            $stock = InventoryStock::firstOrCreate(
                ['product_id' => $productId, 'location_id' => $locationId],
                ['quantity' => 0]
            );

            $previousQuantity = (float) $stock->quantity;
            $currentQuantity = $previousQuantity + $quantity;

            // 2. Update stock level
            $stock->quantity = $currentQuantity;
            $stock->last_updated = now();
            $stock->save();

            // 3. Log movement
            InventoryStockMovement::create([
                'product_id' => $productId,
                'location_id' => $locationId,
                'user_id' => $userId ?: Auth::id(),
                'movement_type' => $type,
                'quantity' => $quantity,
                'previous_quantity' => $previousQuantity,
                'current_quantity' => $currentQuantity,
                'reference_type' => $reference ? get_class($reference) : null,
                'reference_id' => $reference ? $reference->id : null,
                'reason' => $reason,
                'serial_id' => $serialId,
            ]);

            return $stock;
        });
    }

    /**
     * Deduct stock from multiple locations in a branch starting with the primary.
     */
    public function deductFromBranch(int $productId, int $branchId, float $quantity, string $type, $reference = null, ?string $reason = null, ?int $userId = null)
    {
        return DB::transaction(function () use ($productId, $branchId, $quantity, $type, $reference, $reason, $userId) {
            $remainingToDeduct = abs($quantity);
            
            // 1. Get all active locations for the branch, primary first
            $locations = \App\Models\Inventory\InventoryLocation::where('branch_id', $branchId)
                ->where('is_active', true)
                ->orderBy('is_primary', 'desc')
                ->orderBy('id', 'asc')
                ->get();

            if ($locations->isEmpty()) {
                throw new \Exception("No active locations found for branch ID: {$branchId}");
            }

            foreach ($locations as $location) {
                if ($remainingToDeduct <= 0) break;

                $stock = InventoryStock::where('product_id', $productId)
                    ->where('location_id', $location->id)
                    ->first();

                $available = $stock ? (float)$stock->quantity : 0;
                
                if ($available <= 0 && !$location->is_primary) continue;

                $toDeduct = min($remainingToDeduct, $available);
                
                // If it's the primary location and we still have more to deduct, 
                // we take everything from primary even if it goes negative (unless we want to prevent negative stock)
                if ($location->is_primary && $toDeduct < $remainingToDeduct) {
                    $toDeduct = $remainingToDeduct; 
                }

                if ($toDeduct > 0) {
                    $this->updateStock($productId, $location->id, -$toDeduct, $type, $reference, $reason, $userId);
                    $remainingToDeduct -= $toDeduct;
                }
            }

            return true;
        });
    }

    /**
     * Transfer stock between two locations.
     */
    public function transferStock(int $productId, int $fromLocationId, int $toLocationId, float $quantity, $reference = null, ?string $reason = null, ?int $userId = null)
    {
        return DB::transaction(function () use ($productId, $fromLocationId, $toLocationId, $quantity, $reference, $reason, $userId) {
            // 1. Deduct from source
            $this->updateStock($productId, $fromLocationId, -$quantity, 'TRANSFER_OUT', $reference, $reason, $userId);
            
            // 2. Add to destination
            $this->updateStock($productId, $toLocationId, $quantity, 'TRANSFER_IN', $reference, $reason, $userId);
        });
    }
}
