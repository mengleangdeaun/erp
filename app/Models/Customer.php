<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

use Illuminate\Database\Eloquent\SoftDeletes;

class Customer extends Model
{
    use HasFactory, SoftDeletes, \App\Traits\LogsSystemActivity;

    protected $fillable = [
        'customer_code',
        'customer_no',
        'name',
        'phone',
        'email',
        'address',
        'telegram_user_id',
        'joined_at',
        'customer_type_id',
        'status',
        'notes',
    ];

    protected $casts = [
        'joined_at' => 'datetime',
    ];

    public function type()
    {
        return $this->belongsTo(CustomerType::class, 'customer_type_id');
    }

    public function vehicles()
    {
        return $this->hasMany(CustomerVehicle::class);
    }
}
