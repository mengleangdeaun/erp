<?php

namespace App\Models\Inventory;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class InventoryStockAdjustmentItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'adjustment_id',
        'product_id',
        'location_id',
        'current_qty',
        'adjustment_qty',
        'new_qty',
        'reason',
    ];

    public function adjustment()
    {
        return $this->belongsTo(InventoryStockAdjustment::class, 'adjustment_id');
    }

    public function product()
    {
        return $this->belongsTo(InventoryProduct::class, 'product_id');
    }

    public function location()
    {
        return $this->belongsTo(InventoryLocation::class, 'location_id');
    }
}
