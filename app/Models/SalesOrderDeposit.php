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
        'payment_account_id',
        'receipt_path',
        'deposit_date',
        'notes',
        'created_by'
    ];

    public function paymentAccount()
    {
        return $this->belongsTo(\App\Models\Finance\PaymentAccount::class, 'payment_account_id');
    }

    public function creator()
    {
        return $this->belongsTo(\App\Models\User::class, 'created_by');
    }

    public function order()
    {
        return $this->belongsTo(SalesOrder::class, 'sales_order_id');
    }
}
