<?php

namespace App\Http\Controllers\EmployeeApp;

use App\Http\Controllers\Controller;
use App\Models\HR\CompanyFeedback;
use Illuminate\Http\Request;

class FeedbackController extends Controller
{
    public function store(Request $request)
    {
        $request->validate([
            'type' => 'required|string|in:positive,negative',
            'message' => 'required|string',
            'recommendation' => 'nullable|string',
        ]);

        CompanyFeedback::create([
            'type' => $request->type,
            'message' => $request->message,
            'recommendation' => $request->recommendation,
        ]);

        return response()->json(['message' => 'Feedback submitted successfully. Thank you!']);
    }
}
