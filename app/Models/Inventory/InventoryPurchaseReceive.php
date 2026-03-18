<?php

namespace App\Models\Inventory;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class InventoryPurchaseReceive extends Model
{
    use HasFactory;

    protected $fillable = [
        'purchase_order_id', 'location_id', 'receive_date', 'reference_number', 'receiving_note', 'status'
    ];

    protected $casts = [
        'receive_date' => 'datetime',
    ];

    public function purchaseOrder()
    {
        return $this->belongsTo(InventoryPurchaseOrder::class, 'purchase_order_id');
    }

    public function location()
    {
        return $this->belongsTo(InventoryLocation::class, 'location_id');
    }

    public function items()
    {
        return $this->hasMany(InventoryPurchaseReceiveItem::class, 'purchase_receive_id');
    }
}
