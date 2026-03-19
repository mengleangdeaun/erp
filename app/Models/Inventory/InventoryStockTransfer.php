<?php

namespace App\Models\Inventory;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class InventoryStockTransfer extends Model
{
    use HasFactory;

    protected $fillable = [
        'transfer_no',
        'from_location_id',
        'to_location_id',
        'date',
        'status',
        'notes',
        'user_id',
        'approved_by_id',
        'approved_at',
        'rejected_by_id',
        'rejected_at',
        'rejected_reason',
    ];

    protected $casts = [
        'date' => 'date',
        'approved_at' => 'datetime',
        'rejected_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function approvedBy()
    {
        return $this->belongsTo(User::class, 'approved_by_id');
    }

    public function rejectedBy()
    {
        return $this->belongsTo(User::class, 'rejected_by_id');
    }

    public function fromLocation()
    {
        return $this->belongsTo(InventoryLocation::class, 'from_location_id');
    }

    public function toLocation()
    {
        return $this->belongsTo(InventoryLocation::class, 'to_location_id');
    }

    public function items()
    {
        return $this->hasMany(InventoryStockTransferItem::class, 'transfer_id');
    }
}
