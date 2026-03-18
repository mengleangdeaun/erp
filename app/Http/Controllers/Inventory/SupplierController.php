<?php

namespace App\Http\Controllers\Inventory;

use App\Http\Controllers\Controller;
use App\Models\Inventory\InventorySupplier;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class SupplierController extends Controller
{
    public function index()
    {
        return response()->json(InventorySupplier::orderBy('name')->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name'           => 'required|string|max:255',
            'contact_person' => 'nullable|string|max:255',
            'phone'          => 'nullable|string|max:50',
            'email'          => 'nullable|email|max:255',
            'address'        => 'nullable|string',
            'note'           => 'nullable|string',
            'is_active'      => 'boolean',
        ]);

        // Handle file upload
        if ($request->hasFile('attachment_file')) {
            $validated['attachment_file'] = $request->file('attachment_file')
                ->store('suppliers', 'public');
        }

        $supplier = InventorySupplier::create($validated);
        return response()->json($supplier, 201);
    }

    public function show($id)
    {
        return response()->json(InventorySupplier::findOrFail($id));
    }

    public function update(Request $request, $id)
    {
        $supplier = InventorySupplier::findOrFail($id);

        $validated = $request->validate([
            'name'           => 'sometimes|required|string|max:255',
            'contact_person' => 'nullable|string|max:255',
            'phone'          => 'nullable|string|max:50',
            'email'          => 'nullable|email|max:255',
            'address'        => 'nullable|string',
            'note'           => 'nullable|string',
            'is_active'      => 'boolean',
        ]);

        if ($request->hasFile('attachment_file')) {
            if ($supplier->attachment_file) {
                Storage::disk('public')->delete($supplier->attachment_file);
            }
            $validated['attachment_file'] = $request->file('attachment_file')
                ->store('suppliers', 'public');
        }

        $supplier->update($validated);
        return response()->json($supplier);
    }

    public function destroy($id)
    {
        $supplier = InventorySupplier::findOrFail($id);
        if ($supplier->attachment_file) {
            Storage::disk('public')->delete($supplier->attachment_file);
        }
        $supplier->delete();
        return response()->json(['message' => 'Supplier deleted successfully']);
    }
}
