<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class LeavePolicy extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name',
        'description',
        'leave_type_id',
        'accrual_type',
        'accrual_rate',
        'carry_forward_limit',
        'min_days_per_app',
        'max_days_per_app',
        'require_approval',
        'status',
    ];

    protected $casts = [
        'accrual_rate' => 'decimal:2',
        'carry_forward_limit' => 'integer',
        'min_days_per_app' => 'integer',
        'max_days_per_app' => 'integer',
        'require_approval' => 'boolean',
        'status' => 'boolean',
    ];

    public function leaveType()
    {
        return $this->belongsTo(LeaveType::class);
    }
}
