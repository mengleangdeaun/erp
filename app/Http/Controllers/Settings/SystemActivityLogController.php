<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Models\SystemActivityLog;
use Illuminate\Http\Request;

class SystemActivityLogController extends Controller
{
    public function index(Request $request)
    {
        $query = SystemActivityLog::with(['subject', 'causer'])->latest();

        if ($request->has('event') && $request->event) {
            $query->where('event', $request->event);
        }

        if ($request->has('causer_id') && $request->causer_id) {
            $query->where('causer_id', $request->causer_id)
                  ->where('causer_type', 'App\Models\User');
        }

        if ($request->has('subject_type') && $request->subject_type) {
            $query->where('subject_type', 'like', "%{$request->subject_type}%");
        }

        if ($request->has('start_date') && $request->start_date) {
            $query->whereDate('created_at', '>=', $request->start_date);
        }

        if ($request->has('end_date') && $request->end_date) {
            $query->whereDate('created_at', '<=', $request->end_date);
        }

        $logs = $query->paginate($request->get('limit', 15));

        return response()->json($logs);
    }

    public function destroy(Request $request)
    {
        if ($request->has('clear_all') && $request->clear_all) {
            SystemActivityLog::truncate();
            return response()->json(['message' => 'All logs cleared successfully']);
        }

        $ids = $request->input('ids', []);
        if (empty($ids)) {
            return response()->json(['message' => 'No log IDs provided'], 400);
        }

        SystemActivityLog::whereIn('id', $ids)->delete();

        return response()->json(['message' => 'Selected logs deleted successfully']);
    }
}
