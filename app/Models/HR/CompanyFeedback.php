<?php

namespace App\Models\HR;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CompanyFeedback extends Model
{
    use HasFactory;

    protected $table = 'company_feedback';

    protected $fillable = [
        'type',
        'message',
        'recommendation',
    ];
}
