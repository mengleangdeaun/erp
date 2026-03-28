<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class JobCardQCReport extends Model
{
    use HasFactory;

    protected $table = 'job_card_qc_reports';

    protected $fillable = [
        'job_card_id',
        'qc_person_id',
        'rating',
        'decision',
        'damages',
        'item_evaluations',
        'rework_technician_id',
        'notes',
        'is_archived'
    ];

    protected $casts = [
        'damages' => 'array',
        'item_evaluations' => 'array',
        'rating' => 'integer',
        'is_archived' => 'boolean'
    ];

    public function jobCard()
    {
        return $this->belongsTo(JobCard::class);
    }

    public function qcPerson()
    {
        return $this->belongsTo(HR\Employee::class, 'qc_person_id');
    }

    public function reworkTechnician()
    {
        return $this->belongsTo(HR\Employee::class, 'rework_technician_id');
    }

    public function qcItems()
    {
        return $this->hasMany(JobCardQCItem::class, 'qc_report_id');
    }
}
