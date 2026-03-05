<?php

namespace App\Http\Controllers\EmployeeApp;

use App\Http\Controllers\Controller;
use App\Models\EmployeeActivity;
use Illuminate\Http\Request;
use Carbon\Carbon;

class ActivityController extends Controller
{
    private function getAuthenticatedEmployee(Request $request)
    {
        $token = $request->header('Authorization');
        if (!$token) return null;

        // The frontend will send the raw token or 'Bearer token'
        $token = str_replace('Bearer ', '', $token);

        return \App\Models\HR\Employee::where('auth_token', $token)->first();
    }

    /**
     * List the authenticated employee's own activities (paginated).
     */
    public function index(Request $request)
    {
        $employee = $this->getAuthenticatedEmployee($request);
        if (!$employee) return response()->json(['message' => 'Unauthorized Device'], 401);

        $activities = EmployeeActivity::where('employee_id', $employee->id)
            ->orderByDesc('submitted_at')
            ->paginate(15);

        // Append photo URL to each item
        $activities->getCollection()->transform(function ($a) {
            $a->photo_url = $a->photo_url;
            return $a;
        });

        return response()->json($activities);
    }

    /**
     * Submit a new activity (photo + GPS + comment).
     */
    public function store(Request $request)
    {
        $employee = $this->getAuthenticatedEmployee($request);
        if (!$employee) return response()->json(['message' => 'Unauthorized Device'], 401);

        $request->validate([
            'photo'         => 'required|image|max:10240',
            'comment'       => 'nullable|string|max:1000',
            'latitude'      => 'nullable|numeric|between:-90,90',
            'longitude'     => 'nullable|numeric|between:-180,180',
            'location_name' => 'nullable|string|max:255',
        ]);

        $photoPath = $request->file('photo')->store('activities', 'public');

        $now = Carbon::now();

        $activity = EmployeeActivity::create([
            'employee_id'   => $employee->id,
            'photo_path'    => $photoPath,
            'comment'       => $request->comment,
            'latitude'      => $request->latitude,
            'longitude'     => $request->longitude,
            'location_name' => $request->location_name,
            'activity_date' => $now->toDateString(),
            'submitted_at'  => $now,
            'status'        => 'submitted',
        ]);

        $activity->photo_url = $activity->photo_url;

        return response()->json(['message' => 'Activity submitted', 'activity' => $activity], 201);
    }
}
