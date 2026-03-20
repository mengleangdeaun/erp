<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class JobPartMaster extends Model
{
    use HasFactory;

    protected $table = 'job_parts_master';

    protected $fillable = ['name', 'code', 'type', 'is_active'];

    public function services()
    {
        return $this->belongsToMany(Service::class, 'service_parts_mapping', 'part_id', 'service_id');
    }
}
