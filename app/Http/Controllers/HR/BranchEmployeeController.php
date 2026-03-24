<?php

namespace App\Http\Controllers\HR;

use App\Http\Controllers\Controller;
use App\Models\HR\Employee;
use Illuminate\Http\Request;

class BranchEmployeeController extends Controller
{
    /**
     * Display a listing of employees for a specific branch.
     */
    public function index(Request $request)
    {
        $branchId = $request->query('branch_id');
        
        $query = Employee::with(['designation:id,name', 'department:id,name']);
        
        if ($branchId) {
            $query->where('branch_id', $branchId);
        }

        return response()->json($query->latest()->get());
    }

    /**
     * Update employee status or technician flag at branch level.
     */
    public function update(Request $request, Employee $employee)
    {
        $validated = $request->validate([
            'is_active' => 'sometimes|boolean',
            'is_technician' => 'sometimes|boolean',
        ]);

        $employee->update($validated);

        return response()->json($employee->load(['designation', 'department']));
    }
}
