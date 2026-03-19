<?php

namespace App\Http\Controllers;

use App\Models\VehicleBrand;
use Illuminate\Http\Request;

class VehicleBrandController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        return VehicleBrand::with('models')->orderBy('name')->get();
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:vehicle_brands,name',
            'is_active' => 'boolean'
        ]);

        $brand = VehicleBrand::create($validated);

        return response()->json($brand, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(VehicleBrand $vehicleBrand)
    {
        return $vehicleBrand->load('models');
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, VehicleBrand $vehicleBrand)
    {
        $validated = $request->validate([
            'name' => 'string|max:255|unique:vehicle_brands,name,' . $vehicleBrand->id,
            'is_active' => 'boolean'
        ]);

        $vehicleBrand->update($validated);

        return response()->json($vehicleBrand);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(VehicleBrand $vehicleBrand)
    {
        $vehicleBrand->delete();
        return response()->json(null, 204);
    }
}
