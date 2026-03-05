<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MediaFile extends Model
{
    use HasFactory;

    protected $fillable = [
        'name', 'extension', 'file_type', 'size_bytes', 'size_human', 
        'mime_type', 'url', 'path', 'disk', 'is_favorite', 'folder_id'
    ];

    public function folder()
    {
        return $this->belongsTo(MediaFolder::class, 'folder_id');
    }

    protected static function booted()
    {
        static::deleting(function ($mediaFile) {
            if ($mediaFile->path && $mediaFile->disk) {
                \Illuminate\Support\Facades\Storage::disk($mediaFile->disk)->delete($mediaFile->path);
            } elseif ($mediaFile->url) {
                // Fallback for legacy files before this update
                $path = str_replace('/storage/', '', $mediaFile->url);
                \Illuminate\Support\Facades\Storage::disk('public')->delete($path);
            }
        });
    }
}
