<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class JobCardItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'job_card_id',
        'service_id',
        'part_id',
        'technician_id',
        'status',
        'completion_percentage',
        'started_at',
        'completed_at',
        'notes'
    ];

    protected $casts = [
        'completion_percentage' => 'integer',
        'started_at' => 'datetime',
        'completed_at' => 'datetime',
    ];

    public function jobCard()
    {
        return $this->belongsTo(JobCard::class);
    }

    public function service()
    {
        return $this->belongsTo(Service::class);
    }

    public function part()
    {
        return $this->belongsTo(JobPartMaster::class, 'part_id');
    }

    public function technician()
    {
        return $this->belongsTo(HR\Employee::class, 'technician_id');
    }

    public function materialUsage()
    {
        return $this->hasMany(JobCardMaterialUsage::class, 'job_card_item_id');
    }
}
