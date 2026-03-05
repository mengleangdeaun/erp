<?php

namespace App\Http\Controllers\HR;

use App\Http\Controllers\Controller;
use App\Models\LeaveRequest;
use App\Models\LeaveBalance;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class LeaveRequestController extends Controller
{
    /**
     * Display a listing of all leave requests for HR admins.
     */
    public function index(Request $request)
    {
        $query = LeaveRequest::with(['employee', 'leaveType', 'approver'])
            ->orderBy('created_at', 'desc');

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        if ($request->has('employee_id')) {
            $query->where('employee_id', $request->employee_id);
        }

        return response()->json($query->get());
    }

    /**
     * Display the specified leave request.
     */
    public function show($id)
    {
        $request = LeaveRequest::with(['employee', 'leaveType', 'approver'])->findOrFail($id);
        return response()->json($request);
    }

    /**
     * Approve a pending leave request and deduct the balance.
     */
    public function approve(Request $request, $id)
    {
        try {
            DB::beginTransaction();

            $leaveRequest = LeaveRequest::findOrFail($id);

            if ($leaveRequest->status !== 'pending') {
                return response()->json(['message' => 'Only pending requests can be approved.'], 422);
            }

            // Find the balance for this year
            $currentYear = date('Y');
            $balance = LeaveBalance::where('employee_id', $leaveRequest->employee_id)
                ->where('leave_type_id', $leaveRequest->leave_type_id)
                ->where('year', $currentYear)
                ->first();

            if (!$balance || $balance->balance < $leaveRequest->total_days) {
                return response()->json(['message' => 'Insufficient leave balance to approve this request.'], 422);
            }

            // Update Request Status
            $leaveRequest->status = 'approved';
            
            // Optionally set the approver to the current authenticated user if not already set, 
            // but for now we'll just leave whatever was assigned during the PWA submission.
            // if (!$leaveRequest->approved_by) {
            //     $leaveRequest->approved_by = auth()->user()->id; // Or standard Employee resolution
            // }

            $leaveRequest->save();

            // Deduct Balance
            $balance->total_taken += $leaveRequest->total_days;
            $balance->balance -= $leaveRequest->total_days;
            $balance->save();

            DB::commit();
            return response()->json($leaveRequest->load(['employee', 'leaveType']));

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Failed to approve request: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Reject a pending leave request with a reason.
     */
    public function reject(Request $request, $id)
    {
        $validated = $request->validate([
            'rejection_reason' => 'required|string',
        ]);

        $leaveRequest = LeaveRequest::findOrFail($id);

        if ($leaveRequest->status !== 'pending') {
            return response()->json(['message' => 'Only pending requests can be rejected.'], 422);
        }

        $leaveRequest->status = 'rejected';
        $leaveRequest->rejection_reason = $validated['rejection_reason'];
        $leaveRequest->save();

        return response()->json($leaveRequest->load(['employee', 'leaveType']));
    }

    /**
     * Remove the specified resource from storage (Admins only)
     */
    public function destroy($id)
    {
        $leaveRequest = LeaveRequest::findOrFail($id);

        if ($leaveRequest->status === 'approved') {
            return response()->json(['message' => 'Cannot delete an already approved request. Consider reverting it first.'], 422);
        }

        $leaveRequest->delete();
        return response()->json(null, 204);
    }
}
