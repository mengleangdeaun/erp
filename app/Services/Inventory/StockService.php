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
