<?php

namespace App\Models\Inventory;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class InventoryPurchaseOrder extends Model
{
    use HasFactory, \App\Traits\LogsSystemActivity;

    protected $fillable = [
        'supplier_id', 'po_number', 'order_date', 'expected_delivery_date', 'status', 'total_amount', 'note'
    ];

    protected $casts = [
        'order_date' => 'datetime',
        'expected_delivery_date' => 'date',
    ];

    public function supplier()
    {
        return $this->belongsTo(InventorySupplier::class, 'supplier_id');
    }

    public function items()
    {
        return $this->hasMany(InventoryPurchaseOrderItem::class, 'purchase_order_id');
    }}
