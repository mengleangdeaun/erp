<?php

namespace App\Http\Controllers;

use App\Models\SaleRemark;
use Illuminate\Http\Request;

class SaleRemarkController extends Controller
{
    public function index()
    {
        return SaleRemark::latest()->get();
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

    public function update(Request $request, SaleRemark $saleRemark)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'color_code' => 'nullable|string',
            'is_active' => 'boolean'
        ]);

        $saleRemark->update($validated);
        return $saleRemark;
    }

    public function destroy(SaleRemark $saleRemark)
    {
        $saleRemark->delete();
        return response()->json(['message' => 'Deleted successfully']);
    }
}
