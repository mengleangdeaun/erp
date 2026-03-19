<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ServicePartMapping extends Model
{
    use HasFactory;

    protected $table = 'service_parts_mapping';

    protected $fillable = ['service_id', 'part_id'];

    public function service()
    {
        return $this->belongsTo(Service::class);
    }

    public function part()
    {
        return $this->belongsTo(JobPartMaster::class, 'part_id');
    }
}
