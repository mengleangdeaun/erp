<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

use Illuminate\Database\Eloquent\SoftDeletes;

class SalesOrder extends Model
{
    use HasFactory, SoftDeletes, \App\Traits\LogsSystemActivity;

    protected $fillable = [
        'order_no',
        'customer_id',
        'branch_id',
        'vehicle_id',
        'order_date',
        'subtotal',
        'tax_total',
        'discount_total',
        'grand_total',
        'taxable_amount',
        'tax_percent',
        'discount_type',
        'discount_value',
        'paid_amount',
        'balance_amount',
        'invoice_image_path',
        'status',
        'payment_status',
        'notes',
        'sale_remark_id',
        'created_by'
    ];

    public function saleRemark()
    {
        return $this->belongsTo(SaleRemark::class);
    }

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }

    public function branch()
    {
        return $this->belongsTo(HR\Branch::class);
    }

    public function vehicle()
    {
        return $this->belongsTo(CustomerVehicle::class, 'vehicle_id');
    }

    public function items()
    {
        return $this->hasMany(SalesOrderItem::class);
    }

    public function jobCard()
    {
        return $this->hasOne(JobCard::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function deposits()
    {
        return $this->hasMany(SalesOrderDeposit::class);
    }
}
