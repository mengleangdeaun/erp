<?php

namespace App\Models\HR;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Models\Attendance\WorkingShift;
use App\Models\Attendance\AttendancePolicy;

class Employee extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        // Basic Information
        'full_name',
        'employee_id',
        'employee_code',
        'email',
        'auth_token',
        'telegram_user_id',
        'password',
        'phone',
        'date_of_birth',
        'gender',
        'profile_image',
        // Employment Details
        'branch_id',
        'department_id',
        'designation_id',
        'line_manager_id',
        'date_of_joining',
        'employment_type',
        'is_active',
        'working_shift_id',
        'attendance_policy_id',
        // Contact Information
        'address_line_1',
        'address_line_2',
        'city',
        'state',
        'country',
        'postal_code',
        'emergency_contact_name',
        'emergency_contact_relationship',
        'emergency_contact_phone',
        // Banking Information
        'bank_name',
        'account_holder_name',
        'account_number',
        'tax_payer_id',
        'base_salary',
        'is_technician',
        'preferences',
    ];

    protected $hidden = [
        'password',
    ];

    protected $casts = [
        'date_of_birth'  => 'date',
        'date_of_joining' => 'date',
        'base_salary'    => 'decimal:2',
        'is_technician'  => 'boolean',
        'is_active'      => 'boolean',
        'preferences'    => 'array',
    ];

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }

    public function department()
    {
        return $this->belongsTo(Department::class);
    }

    public function designation()
    {
        return $this->belongsTo(Designation::class);
    }

    public function lineManager()
    {
        return $this->belongsTo(Employee::class, 'line_manager_id');
    }

    public function subordinates()
    {
        return $this->hasMany(Employee::class, 'line_manager_id');
    }

    public function documents()
    {
        return $this->hasMany(EmployeeDocument::class);
    }

    public function workingShift()
    {
        return $this->belongsTo(WorkingShift::class);
    }

    public function attendancePolicy()
    {
        return $this->belongsTo(AttendancePolicy::class);
    }

    public function awards()
    {
        return $this->hasMany(Award::class);
    }

    public function promotions()
    {
        return $this->hasMany(Promotion::class);
    }

    public function resignations()
    {
        return $this->hasMany(Resignation::class);
    }

    public function terminations()
    {
        return $this->hasMany(Termination::class);
    }

    public function warnings()
    {
        return $this->hasMany(Warning::class);
    }

    public function attendanceRecords()
    {
        return $this->hasMany(\App\Models\Attendance\AttendanceRecord::class);
    }

    public function activities()
    {
        return $this->hasMany(\App\Models\EmployeeActivity::class);
    }
}
