<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\HR\Employee;

class EmpPreference extends Model
{
    protected $table = 'emp_preferences';

    protected $fillable = [
        'employee_id',
        'font_family',
        'font_size',
        'color_theme',
        'dark_mode',
        'notifications_enabled',
    ];

    protected $casts = [
        'dark_mode' => 'boolean',
        'notifications_enabled' => 'boolean',
    ];

    public function employee()
    {
        return $this->belongsTo(Employee::class);
    }
}
