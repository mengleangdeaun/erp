<?php

namespace App\Http\Controllers\Attendance;

use App\Http\Controllers\Controller;
use App\Models\Attendance\AttendanceRecord;
use Illuminate\Http\Request;
use Carbon\Carbon;

class AttendanceRecordController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = AttendanceRecord::with('employee');

        if ($request->has('employee_id') && !empty($request->employee_id)) {
            $query->where('employee_id', $request->employee_id);
        }

        if ($request->has('start_date') && $request->has('end_date')) {
            $query->whereBetween('date', [$request->start_date, $request->end_date]);
        } elseif ($request->has('start_date')) {
            $query->where('date', '>=', $request->start_date);
        } elseif ($request->has('end_date')) {
            $query->where('date', '<=', $request->end_date);
        }

        $records = $query->orderBy('date', 'desc')->get();

        // Transform records to match frontend expectations
        $records->transform(function ($record) {
            $checkIn = $record->clock_in_time ? Carbon::parse($record->clock_in_time) : null;
            $checkOut = $record->clock_out_time ? Carbon::parse($record->clock_out_time) : null;
            
            $totalHours = null;
            if ($checkIn && $checkOut) {
                $totalHours = round($checkIn->floatDiffInHours($checkOut), 2);
            }

            return [
                'id' => $record->id,
                'employee_id' => $record->employee_id,
                'employee' => $record->employee,
                'date' => $record->date,
                'check_in' => $record->clock_in_time,
                'check_out' => $record->clock_out_time,
                'status' => $record->status,
                'total_hours' => $totalHours,
                'clock_in_location' => $record->clock_in_location,
                'clock_out_location' => $record->clock_out_location,
                'created_at' => $record->created_at,
                'updated_at' => $record->updated_at,
            ];
        });

        return response()->json($records);
    }
}
