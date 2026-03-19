<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class JobCardMaterialUsage extends Model
{
    use HasFactory;

    protected $table = 'job_card_material_usage';

    protected $fillable = [
        'job_card_id',
        'job_card_item_id',
        'product_id',
        'spent_qty',
        'actual_qty',
        'unit'
    ];

    public function jobCard()
    {
        return $this->belongsTo(JobCard::class);
    }

    public function jobCardItem()
    {
        return $this->belongsTo(JobCardItem::class, 'job_card_item_id');
    }

    public function product()
    {
        return $this->belongsTo(\App\Models\Inventory\InventoryProduct::class, 'product_id');
    }
}
