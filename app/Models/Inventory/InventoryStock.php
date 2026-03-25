<?php

namespace App\Models\Inventory;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class InventoryStock extends Model
{
    use HasFactory;

    protected $fillable = ['product_id', 'location_id', 'quantity', 'last_updated'];

    protected $casts = [
        'quantity' => 'decimal:2',
    ];

    public function product()
    {
        return $this->belongsTo(InventoryProduct::class);
    }

    public function location()
    {
        return $this->belongsTo(InventoryLocation::class);
    }
}
