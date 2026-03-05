<?php

namespace App\Models\HR;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Termination extends Model
{
    use HasFactory;

    protected $fillable = [
        'employee_id',
        'termination_type',
        'notice_date',
        'termination_date',
        'notice_period',
        'reason',
        'description',
        'document',
        'status',
        'exit_interview_conducted',
        'exit_interview_date',
        'exit_feedback',
    ];

    protected $casts = [
        'exit_interview_conducted' => 'boolean',
        'notice_date'              => 'date',
        'termination_date'         => 'date',
        'exit_interview_date'      => 'date',
    ];

    public function employee()
    {
        return $this->belongsTo(Employee::class);
    }
}
