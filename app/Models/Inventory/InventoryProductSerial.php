<?php

namespace App\Models\Inventory;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\HR\Branch;

class InventoryProductSerial extends Model
{
    use HasFactory, \App\Traits\LogsSystemActivity;

    protected $fillable = [
        'product_id',
        'serial_number',
        'length',
        'initial_quantity',
        'current_quantity',
        'width',
        'branch_id',
        'location_id',
        'status',
        'notes'
    ];

    protected $casts = [
        'length' => 'decimal:4',
        'initial_quantity' => 'decimal:4',
        'current_quantity' => 'decimal:4',
        'width' => 'decimal:4',
    ];

    public function product()
    {
        return $this->belongsTo(InventoryProduct::class, 'product_id');
    }

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }

    public function location()
    {
        return $this->belongsTo(InventoryLocation::class);
    }
}
