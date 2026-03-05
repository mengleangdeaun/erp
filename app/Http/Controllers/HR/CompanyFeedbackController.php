<?php

namespace App\Http\Controllers\HR;

use App\Http\Controllers\Controller;
use App\Models\HR\CompanyFeedback;
use Illuminate\Http\Request;

class CompanyFeedbackController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = CompanyFeedback::latest();

        if ($request->filled('type') && $request->type !== 'all') {
            $query->where('type', $request->type);
        }

        $feedbacks = $query->paginate(10);
        return response()->json($feedbacks);
    }

    public function destroy(CompanyFeedback $companyFeedback)
    {
        $companyFeedback->delete();
        return response()->json(['message' => 'Feedback deleted successfully']);
    }
}
