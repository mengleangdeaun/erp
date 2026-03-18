<?php

namespace App\Models\Inventory;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class InventoryUom extends Model
{
    use HasFactory;

    protected $fillable = ['code', 'name', 'is_active'];
}
