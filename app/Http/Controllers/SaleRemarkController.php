<?php

namespace App\Http\Controllers;

use App\Models\SaleRemark;
use Illuminate\Http\Request;

class SaleRemarkController extends Controller
{
    public function index(Request $request)
    {
        $query = SaleRemark::query();

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }

        if ($request->has('all') || $request->paginate === 'false') {
            return $query->latest()->get();
        }

        return $query->latest()->paginate($request->per_page ?? 15);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'color_code' => 'nullable|string',
            'is_active' => 'boolean'
        ]);

        return SaleRemark::create($validated);
    }

    public function update(Request $request, SaleRemark $remark)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'color_code' => 'nullable|string',
            'is_active' => 'boolean'
        ]);

        $remark->update($validated);
        return $remark;
    }

    public function destroy(SaleRemark $remark)
    {
        $remark->delete();
        return response()->json(['message' => 'Deleted successfully']);
    }
}
