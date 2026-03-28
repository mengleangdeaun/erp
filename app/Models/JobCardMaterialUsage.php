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
        'serial_id',
        'spent_qty',
        'actual_qty',
        'unit',
        'width_on_car',
        'height_on_car',
        'width_cut',
        'height_cut',
        'is_damage'
    ];

    protected $casts = [
        'spent_qty' => 'decimal:4',
        'actual_qty' => 'decimal:4',
        'width_on_car' => 'decimal:2',
        'height_on_car' => 'decimal:2',
        'width_cut' => 'decimal:2',
        'height_cut' => 'decimal:2',
        'is_damage' => 'boolean',
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

    public function serial()
    {
        return $this->belongsTo(\App\Models\Inventory\InventoryProductSerial::class, 'serial_id');
    }
}
