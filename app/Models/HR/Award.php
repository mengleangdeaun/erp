<?php

namespace App\Models\HR;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Award extends Model
{
    use HasFactory;

    protected $fillable = [
        'employee_id',
        'award_type_id',
        'date',
        'gift',
        'description',
        'certificate',
        'photo',
    ];

    public function employee()
    {
        return $this->belongsTo(Employee::class);
    }

    public function awardType()
    {
        return $this->belongsTo(AwardType::class);
    }
}
