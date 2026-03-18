<?php

namespace App\Models\Inventory;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class InventoryPurchaseReceiveItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'purchase_receive_id', 'purchase_order_item_id', 'product_id', 'qty_received'
    ];

    public function product()
    {
        return $this->belongsTo(InventoryProduct::class, 'product_id');
    }

    public function poItem()
    {
        return $this->belongsTo(InventoryPurchaseOrderItem::class, 'purchase_order_item_id');
    }
}
