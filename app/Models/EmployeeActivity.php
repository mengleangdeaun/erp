<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\HR\Employee;

class EmployeeActivity extends Model
{
    protected $table = 'employee_activities';

    protected $fillable = [
        'employee_id',
        'photo_path',
        'comment',
        'latitude',
        'longitude',
        'location_name',
        'activity_date',
        'submitted_at',
        'status',
        'admin_note',
    ];

    protected $casts = [
        'latitude'     => 'float',
        'longitude'    => 'float',
        'activity_date'=> 'date',
        'submitted_at' => 'datetime',
    ];

    public function employee()
    {
        return $this->belongsTo(Employee::class);
    }

    public function getPhotoUrlAttribute(): string
    {
        return asset('storage/' . $this->photo_path);
    }
}
