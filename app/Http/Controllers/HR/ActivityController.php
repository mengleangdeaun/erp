<?php

namespace App\Http\Controllers\HR;

use App\Http\Controllers\Controller;
use App\Models\EmployeeActivity;
use Illuminate\Http\Request;

class ActivityController extends Controller
{
    /**
     * Paginated list of all activities with filters.
     */
    public function index(Request $request)
    {
        $query = EmployeeActivity::with(['employee.branch', 'employee.designation'])
            ->orderByDesc('submitted_at');

        if ($request->filled('employee_id')) {
            $query->where('employee_id', $request->employee_id);
        }

        if ($request->filled('branch_id')) {
            $query->whereHas('employee', fn($q) => $q->where('branch_id', $request->branch_id));
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('date_from')) {
            $query->whereDate('activity_date', '>=', $request->date_from);
        }

        if ($request->filled('date_to')) {
            $query->whereDate('activity_date', '<=', $request->date_to);
        }

        if ($request->filled('search')) {
            $query->whereHas('employee', function ($q) use ($request) {
                $q->where('full_name', 'like', "%{$request->search}%")
                  ->orWhere('employee_id', 'like', "%{$request->search}%");
            });
        }

        // Sorting
        $sortBy = $request->get('sort_by', 'submitted_at');
        $sortDir = $request->get('sort_dir', 'desc');
        
        // Handle related-table sorting if needed, else default
        if ($sortBy === 'employee.full_name') {
            $query->join('employees', 'employee_activities.employee_id', '=', 'employees.id')
                  ->orderBy('employees.full_name', $sortDir)
                  ->select('employee_activities.*');
        } else {
            $query->orderBy($sortBy, $sortDir);
        }

        $perPage = $request->get('per_page', 20);
        $activities = $query->paginate($perPage);

        $activities->getCollection()->transform(function ($a) {
            $a->photo_url = $a->photo_url;
            return $a;
        });

        return response()->json($activities);
    }

    /**
     * Single activity detail.
     */
    public function show(EmployeeActivity $activity)
    {
        $activity->load('employee.branch', 'employee.designation');
        $activity->photo_url = $activity->photo_url;
        return response()->json($activity);
    }

    /**
     * Update status and/or admin note.
     */
    public function updateStatus(Request $request, EmployeeActivity $activity)
    {
        $request->validate([
            'status'     => 'required|in:submitted,reviewed,flagged',
            'admin_note' => 'nullable|string|max:2000',
        ]);

        $activity->update([
            'status'     => $request->status,
            'admin_note' => $request->admin_note,
        ]);

        return response()->json(['message' => 'Activity updated', 'activity' => $activity]);
    }

    /**
     * Delete an activity and its photo from storage.
     */
    public function destroy(EmployeeActivity $activity)
    {
        \Illuminate\Support\Facades\Storage::disk('public')->delete($activity->photo_path);
        $activity->delete();

        return response()->json(['message' => 'Activity deleted']);
    }
}
