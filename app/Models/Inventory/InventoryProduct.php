<?php

namespace App\Models\Inventory;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class InventoryProduct extends Model
{
    use HasFactory;

    protected $fillable = [
        'code', 'sku', 'barcode', 'category_id', 'base_uom_id', 'purchase_uom_id', 
        'uom_multiplier', 'length', 'width', 'brand', 'name', 'img', 'description', 
        'cost', 'price', 'reorder_level', 'is_active'
    ];

    public function category()
    {
        return $this->belongsTo(InventoryCategory::class);
    }

    public function baseUom()
    {
        return $this->belongsTo(InventoryUom::class, 'base_uom_id');
    }

    public function purchaseUom()
    {
        return $this->belongsTo(InventoryUom::class, 'purchase_uom_id');
    }

    public function tags()
    {
        return $this->belongsToMany(InventoryTag::class, 'inventory_product_tags', 'product_id', 'tag_id');
    }

    public function stocks()
    {
        return $this->hasMany(InventoryStock::class, 'product_id');
    }

    public function branches()
    {
        return $this->belongsToMany(\App\Models\HR\Branch::class, 'branch_inventory_product', 'inventory_product_id', 'branch_id')->withPivot('is_active')->withTimestamps();
    }
}
