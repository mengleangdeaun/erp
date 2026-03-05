<?php

namespace App\Http\Controllers\EmployeeApp;

use App\Http\Controllers\Controller;
use App\Models\LeaveBalance;
use Illuminate\Http\Request;

class LeaveController extends Controller
{
    /**
     * Helper to authenticate the device token passively without Laravel Sanctum overhead for the minimal PWA.
     */
    private function getAuthenticatedEmployee(Request $request)
    {
        $token = $request->header('Authorization') ?? $request->bearerToken();
        if (!$token) return null;

        // The frontend will send the raw token or 'Bearer token'
        $token = str_replace('Bearer ', '', $token);
        
        return \App\Models\HR\Employee::where('auth_token', $token)->first();
    }

    /**
     * Get the authenticated employee's leave balances for the current year.
     */
    public function myBalances(Request $request)
    {
        $employee = $this->getAuthenticatedEmployee($request);
        
        if (!$employee) {
            return response()->json(['message' => 'Employee profile not found.'], 404);
        }

        $currentYear = date('Y');
        
        $balances = LeaveBalance::with('leaveType')
            ->where('employee_id', $employee->id)
            ->where('year', $currentYear)
            ->get();
            
        return response()->json($balances);
    }
}
