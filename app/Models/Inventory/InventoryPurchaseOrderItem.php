<?php

namespace App\Models\Inventory;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class InventoryPurchaseOrderItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'purchase_order_id', 'product_id', 'order_qty', 'unit_cost', 'total_cost', 'received_qty'
    ];

    public function product()
    {
        return $this->belongsTo(InventoryProduct::class, 'product_id');
    }}
