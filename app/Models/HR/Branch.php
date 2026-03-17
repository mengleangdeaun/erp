<?php

namespace App\Models\HR;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Branch extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'code',
        'address',
        'city',
        'state',
        'country',
        'zip_code',
        'phone',
        'email',
        'lat',
        'lng',
        'allowed_radius',
        'status',
        'telegram_chat_id',
        'telegram_topic_id',
    ];
}
