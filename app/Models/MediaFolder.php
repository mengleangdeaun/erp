<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MediaFolder extends Model
{
    use HasFactory;

    protected $fillable = ['name', 'color', 'parent_id'];

    public function children()
    {
        return $this->hasMany(MediaFolder::class, 'parent_id');
    }

    public function children_recursive()
    {
        return $this->children()->with('children_recursive');
    }

    public function files()
    {
        return $this->hasMany(MediaFile::class, 'folder_id');
    }
}
