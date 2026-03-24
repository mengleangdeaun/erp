<?php

namespace App\Models\Inventory;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class InventoryLocation extends Model
{
    use HasFactory;

    protected $fillable = ['name', 'description', 'address', 'is_active', 'is_primary', 'branch_id'];

    public function branch()
    {
        return $this->belongsTo(\App\Models\HR\Branch::class);
    }

    public function stocks()
    {
        return $this->hasMany(InventoryStock::class, 'location_id');
    }
}
