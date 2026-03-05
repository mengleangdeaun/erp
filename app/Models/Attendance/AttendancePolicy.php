<?php

namespace App\Models\Attendance;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AttendancePolicy extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'late_tolerance_minutes',
        'early_departure_tolerance_minutes',
        'overtime_minimum_minutes',
        'status',
        'description',
    ];
}
