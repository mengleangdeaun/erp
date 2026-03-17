<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Announcement extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'title',
        'type',
        'short_description',
        'content',
        'start_date',
        'end_date',
        'attachments',
        'featured_image',
        'is_featured',
        'targeting_type',
        'target_ids',
        'published_at',
        'status',
        'created_by',
    ];

    protected $casts = [
        'attachments' => 'array',
        'target_ids' => 'array',
        'is_featured' => 'boolean',
        'start_date' => 'datetime',
        'end_date' => 'datetime',
        'published_at' => 'datetime',
    ];

    public function createdBy()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function views()
    {
        return $this->hasMany(AnnouncementView::class);
    }

    public function scopePublished($query)
    {
        return $query->where('status', 'published')
            ->where(function($q) {
                $q->where('published_at', '<=', now())
                  ->orWhereNull('published_at');
            });
    }

    public function scopeFeatured($query)
    {
        return $query->where('is_featured', true);
    }

    public function getViewCountAttribute(): int
    {
        return $this->views()->count();
    }
}
