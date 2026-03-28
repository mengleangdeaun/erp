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
        'job_part_id',
        'item_name',
        'description',
        'quantity',
        'unit_price',
        'discount_amount',
        'tax_amount',
        'subtotal',
        'original_item_id',
        'replacement_type_id'
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
