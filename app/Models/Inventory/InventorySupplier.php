<?php

namespace App\Models\Inventory;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class InventorySupplier extends Model
{
    use HasFactory;

    protected $fillable = [
        'name', 'contact_person', 'phone', 'email', 'address', 'note', 'attachment_file', 'is_active'
    ];}
