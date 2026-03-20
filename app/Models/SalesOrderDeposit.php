<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SalesOrderDeposit extends Model
{
    use HasFactory;

    protected $fillable = [
        'sales_order_id',
        'amount',
        'payment_method',
        'deposit_date',
        'notes'
    ];

    public function order()
    {
        return $this->belongsTo(SalesOrder::class, 'sales_order_id');
    }
}
