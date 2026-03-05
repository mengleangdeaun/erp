<?php

namespace App\Http\Controllers\HR;

use App\Http\Controllers\Controller;
use App\Models\HR\Promotion;
use Illuminate\Http\Request;

class PromotionController extends Controller
{
    public function index()
    {
        $promotions = Promotion::with([
            'employee:id,full_name,employee_code,profile_image',
            'previousDesignation:id,name',
            'newDesignation:id,name',
        ])->latest()->get();

        return response()->json($promotions);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'employee_id'              => 'required|exists:employees,id',
            'previous_designation_id'  => 'required|exists:designations,id',
            'new_designation_id'       => 'required|exists:designations,id|different:previous_designation_id',
            'promotion_date'           => 'required|date',
            'effective_date'           => 'required|date',
            'salary_adjustment'        => 'nullable|numeric',
            'reason'                   => 'nullable|string',
            'document'                 => 'nullable|string',
            'status'                   => 'required|in:pending,approved,rejected',
        ]);

        $promotion = Promotion::create($validated);
        $promotion->load([
            'employee:id,full_name,employee_code,profile_image',
            'previousDesignation:id,name',
            'newDesignation:id,name',
        ]);

        return response()->json($promotion, 201);
    }

    public function show(Promotion $promotion)
    {
        $promotion->load([
            'employee:id,full_name,employee_code,profile_image',
            'previousDesignation:id,name',
            'newDesignation:id,name',
        ]);
        return response()->json($promotion);
    }

    public function update(Request $request, Promotion $promotion)
    {
        $validated = $request->validate([
            'employee_id'              => 'required|exists:employees,id',
            'previous_designation_id'  => 'required|exists:designations,id',
            'new_designation_id'       => 'required|exists:designations,id|different:previous_designation_id',
            'promotion_date'           => 'required|date',
            'effective_date'           => 'required|date',
            'salary_adjustment'        => 'nullable|numeric',
            'reason'                   => 'nullable|string',
            'document'                 => 'nullable|string',
            'status'                   => 'required|in:pending,approved,rejected',
        ]);

        $promotion->update($validated);
        $promotion->load([
            'employee:id,full_name,employee_code,profile_image',
            'previousDesignation:id,name',
            'newDesignation:id,name',
        ]);

        return response()->json($promotion);
    }

    public function destroy(Promotion $promotion)
    {
        $promotion->delete();
        return response()->json(null, 204);
    }
}
