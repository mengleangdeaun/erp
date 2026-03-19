<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

use Illuminate\Database\Eloquent\SoftDeletes;

class Service extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name',
        'code',
        'base_price',
        'description',
        'category_id',
        'is_active'
    ];

    public function category()
    {
        return $this->belongsTo(\App\Models\Inventory\Category::class, 'category_id');
    }

    public function materials()
    {
        return $this->hasMany(ServiceMaterial::class);
    }

    public function parts()
    {
        return $this->belongsToMany(JobPartMaster::class, 'service_parts_mapping', 'service_id', 'part_id');
    }
}
