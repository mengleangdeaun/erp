<?php

namespace App\Models\HR;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AwardType extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'status',
        'description',
    ];
}
