<?php

namespace App\Models\HR;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Warning extends Model
{
    use HasFactory;

    protected $fillable = [
        'employee_id',
        'warning_by',
        'warning_type',
        'subject',
        'severity',
        'warning_date',
        'description',
        'document',
        'expiry_date',
        'has_improvement_plan',
        'ip_goal',
        'ip_start_date',
        'ip_end_date',
    ];

    protected $casts = [
        'has_improvement_plan' => 'boolean',
        'warning_date'         => 'date',
        'expiry_date'          => 'date',
        'ip_start_date'        => 'date',
        'ip_end_date'          => 'date',
    ];

    public function employee()
    {
        return $this->belongsTo(Employee::class);
    }
}
