<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class JobCardDamage extends Model
{
    use HasFactory;

    protected $table = 'job_card_damages';

    protected $fillable = [
        'job_card_id',
        'sales_order_id',
        'job_card_item_id',
        'qc_report_id',
        'mistake_staff_ids',
        'rework_staff_ids',
        'reason_id',
        'rating',
        'notes',
        'incident_phase',
        'status'
    ];

    protected $casts = [
        'mistake_staff_ids' => 'array',
        'rework_staff_ids' => 'array',
        'rating' => 'integer'
    ];

    public function jobCard()
    {
        return $this->belongsTo(JobCard::class);
    }

    public function jobCardItem()
    {
        return $this->belongsTo(JobCardItem::class);
    }

    public function qcReport()
    {
        return $this->belongsTo(JobCardQCReport::class, 'qc_report_id');
    }

    public function reason()
    {
        return $this->belongsTo(JobCardReplacementType::class, 'reason_id');
    }
}
