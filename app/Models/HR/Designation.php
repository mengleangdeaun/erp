<?php

namespace App\Models\HR;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Designation extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'description',
        'status',
    ];

    public function departments()
    {
        return $this->belongsToMany(Department::class);
    }

    public function previousPromotions()
    {
        return $this->hasMany(Promotion::class, 'previous_designation_id');
    }

    public function newPromotions()
    {
        return $this->hasMany(Promotion::class, 'new_designation_id');
    }
}
