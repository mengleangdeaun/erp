<?php

namespace App\Models\HR;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Resignation extends Model
{
    use HasFactory;

    protected $fillable = [
        'employee_id',
        'resignation_date',
        'last_working_day',
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
        'resignation_date'         => 'date',
        'last_working_day'         => 'date',
        'exit_interview_date'      => 'date',
    ];

    public function employee()
    {
        return $this->belongsTo(Employee::class);
    }
}
