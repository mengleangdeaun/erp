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
        'notes',
        'type',
        'parent_id',
        'replacement_type_id',
        'technician_lead_id'
    ];

    public function order()
    {
        return $this->belongsTo(SalesOrder::class, 'sales_order_id');
    }

    public function branch()
    {
        return $this->belongsTo(HR\Branch::class);
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

    public function parent()
    {
        return $this->belongsTo(JobCard::class, 'parent_id');
    }

    public function replacements()
    {
        return $this->hasMany(JobCard::class, 'parent_id');
    }

    public function replacementType()
    {
        return $this->belongsTo(JobCardReplacementType::class, 'replacement_type_id');
    }

    public function leadTechnician()
    {
        return $this->belongsTo(HR\Employee::class, 'technician_lead_id');
    }
}
