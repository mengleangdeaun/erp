<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class JobCardQCItem extends Model
{
    use HasFactory;

    protected $table = 'job_card_qc_items';

    protected $fillable = [
        'qc_report_id',
        'job_card_item_id',
        'rating',
        'status',
        'replacement_type_id',
        'rework_technician_id',
        'notes'
    ];

    public function qcReport()
    {
        return $this->belongsTo(JobCardQCReport::class, 'qc_report_id');
    }

    public function jobCardItem()
    {
        return $this->belongsTo(JobCardItem::class);
    }

    public function replacementType()
    {
        return $this->belongsTo(JobCardReplacementType::class, 'replacement_type_id');
    }

    public function reworkTechnician()
    {
        return $this->belongsTo(HR\Employee::class, 'rework_technician_id');
    }
}
