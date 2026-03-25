<?php

namespace App\Models\Inventory;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class InventorySerialMovement extends Model
{
    protected $fillable = [
        'serial_id',
        'product_id',
        'location_id',
        'user_id',
        'movement_type',
        'quantity',
        'width',
        'height',
        'previous_quantity',
        'current_quantity',
        'reference_type',
        'reference_id',
        'reason',
    ];

    public function serial()
    {
        return $this->belongsTo(InventoryProductSerial::class, 'serial_id');
    }

    public function product()
    {
        return $this->belongsTo(InventoryProduct::class);
    }

    public function location()
    {
        return $this->belongsTo(InventoryLocation::class);
    }

    public function user()
    {
        return $this->belongsTo(\App\Models\User::class);
    }
}
