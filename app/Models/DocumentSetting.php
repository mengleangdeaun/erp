<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DocumentSetting extends Model
{
    protected $fillable = [
        'document_type',
        'prefix',
        'suffix',
        'number_padding',
        'next_number',
        'is_yearly_reset',
        'is_monthly_reset',
        'last_reset_date',
        'date_format',
        'separator',
        'branch_id',
        'include_branch_code',
    ];

    protected $casts = [
        'number_padding' => 'integer',
        'next_number' => 'integer',
        'is_yearly_reset' => 'boolean',
        'is_monthly_reset' => 'boolean',
        'last_reset_date' => 'date',
    ];
}
