<?php

namespace App\Http\Controllers;

use App\Models\CustomerType;
use Illuminate\Http\Request;

class CustomerTypeController extends Controller
{
    public function index()
    {
        return CustomerType::withCount('customers')->get();
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'is_default' => 'boolean',
        ]);

        if ($validated['is_default'] ?? false) {
            CustomerType::where('is_default', true)->update(['is_default' => false]);
        }

        return CustomerType::create($validated);
    }

    public function update(Request $request, CustomerType $customerType)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'is_default' => 'boolean',
        ]);

        if ($validated['is_default'] ?? false) {
            CustomerType::where('id', '!=', $customerType->id)->where('is_default', true)->update(['is_default' => false]);
        }

        $customerType->update($validated);
        return $customerType;
    }

    public function destroy(CustomerType $customerType)
    {
        if ($customerType->customers()->count() > 0) {
            return response()->json(['message' => 'Cannot delete type with associated customers'], 422);
        }
        $customerType->delete();
        return response()->json(null, 204);
    }
}
