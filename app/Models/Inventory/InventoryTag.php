<?php

namespace App\Models\Inventory;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class InventoryTag extends Model
{
    use HasFactory;

    protected $fillable = ['name', 'color', 'is_active'];
}
