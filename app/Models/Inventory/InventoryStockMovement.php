<?php

namespace App\Models\Inventory;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class InventoryStockMovement extends Model
{
    use HasFactory;

    protected $fillable = [
        'product_id',
        'location_id',
        'serial_id',
        'user_id',
        'movement_type',
        'quantity',
        'previous_quantity',
        'current_quantity',
        'reference_type',
        'reference_id',
        'reason',
    ];

    protected $casts = [
        'quantity' => 'decimal:4',
        'previous_quantity' => 'decimal:4',
        'current_quantity' => 'decimal:4',
    ];

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
        return $this->belongsTo(User::class);
    }

    public function reference()
    {
        return $this->morphTo();
    }

    public function serial()
    {
        return $this->belongsTo(InventoryProductSerial::class, 'serial_id');
    }
}
