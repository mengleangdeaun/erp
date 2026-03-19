<?php

namespace App\Models\Inventory;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class InventoryStockAdjustment extends Model
{
    use HasFactory;

    protected $fillable = [
        'adjustment_no',
        'date',
        'user_id',
        'notes',
        'status',
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

    public function items()
    {
        return $this->hasMany(InventoryStockAdjustmentItem::class, 'adjustment_id');
    }
}
