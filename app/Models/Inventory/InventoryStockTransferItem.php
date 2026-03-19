<?php

namespace App\Models\Inventory;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class InventoryStockTransferItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'transfer_id',
        'product_id',
        'quantity',
    ];

    public function transfer()
    {
        return $this->belongsTo(InventoryStockTransfer::class, 'transfer_id');
    }

    public function product()
    {
        return $this->belongsTo(InventoryProduct::class, 'product_id');
    }
}
