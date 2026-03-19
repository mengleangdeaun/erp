<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

use Illuminate\Database\Eloquent\SoftDeletes;

class JobCard extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'job_no',
        'sales_order_id',
        'branch_id',
        'customer_id',
        'vehicle_id',
        'mileage_in',
        'started_at',
        'completed_at',
        'status',
        'notes'
    ];

    public function order()
    {
        return $this->belongsTo(SalesOrder::class, 'sales_order_id');
    }

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }

    public function vehicle()
    {
        return $this->belongsTo(CustomerVehicle::class, 'vehicle_id');
    }

    public function items()
    {
        return $this->hasMany(JobCardItem::class);
    }

    public function materialUsage()
    {
        return $this->hasMany(JobCardMaterialUsage::class);
    }
}
