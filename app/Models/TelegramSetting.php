<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TelegramSetting extends Model
{
    protected $fillable = [
        'bot_token',
        'bot_username',
        'global_chat_id',
        'global_topic_id',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    protected $hidden = ['bot_token'];

    /**
     * Get the single settings record.
     */
    public static function instance(): ?self
    {
        return static::first();
    }
}
