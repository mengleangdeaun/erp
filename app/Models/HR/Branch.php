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

    public function locations()
    {
        return $this->hasMany(\App\Models\Inventory\InventoryLocation::class);
    }

    public function inventoryProducts()
    {
        return $this->belongsToMany(\App\Models\Inventory\InventoryProduct::class, 'branch_inventory_product', 'branch_id', 'inventory_product_id')->withPivot('is_active', 'reorder_level')->withTimestamps();
    }

    public function services()
    {
        return $this->belongsToMany(\App\Models\Service::class, 'branch_service', 'branch_id', 'service_id')->withPivot('is_active')->withTimestamps();
    }
}
