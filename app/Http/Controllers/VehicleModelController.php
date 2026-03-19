<?php

namespace App\Http\Controllers;

use App\Models\VehicleModel;
use Illuminate\Http\Request;

class VehicleModelController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        return VehicleModel::with('brand')->orderBy('name')->get();
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'brand_id' => 'required|exists:vehicle_brands,id',
            'name' => 'required|string|max:255',
            'is_active' => 'boolean'
        ]);

        $model = VehicleModel::create($validated);

        return response()->json($model, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(VehicleModel $vehicleModel)
    {
        return $vehicleModel->load('brand');
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, VehicleModel $vehicleModel)
    {
        $validated = $request->validate([
            'brand_id' => 'exists:vehicle_brands,id',
            'name' => 'string|max:255',
            'is_active' => 'boolean'
        ]);

        $vehicleModel->update($validated);

        return response()->json($vehicleModel);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(VehicleModel $vehicleModel)
    {
        $vehicleModel->delete();
        return response()->json(null, 204);
    }
}
