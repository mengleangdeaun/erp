<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SalesOrderItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'sales_order_id',
        'itemable_id',
        'itemable_type',
        'item_name',
        'description',
        'quantity',
        'unit_price',
        'discount_amount',
        'tax_amount',
        'subtotal'
    ];

    public function order()
    {
        return $this->belongsTo(SalesOrder::class, 'sales_order_id');
    }

    public function itemable()
    {
        return $this->morphTo();
    }
}
