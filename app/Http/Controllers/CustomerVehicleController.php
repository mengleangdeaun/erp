<?php

namespace App\Http\Controllers;

use App\Models\CustomerVehicle;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CustomerVehicleController extends Controller
{
    public function index(Request $request)
    {
        $query = CustomerVehicle::with(['customer', 'brand', 'model']);

        if ($request->customer_id) {
            $query->where('customer_id', $request->customer_id);
        }

        if ($request->search) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('plate_number', 'like', "%{$search}%")
                  ->orWhere('vin_last_4', 'like', "%{$search}%")
                  ->orWhereHas('customer', function($cq) use ($search) {
                      $cq->where('name', 'like', "%{$search}%")
                        ->orWhere('customer_code', 'like', "%{$search}%");
                  });
            });
        }

        return $query->latest()->get();
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'customer_id' => 'required|exists:customers,id',
            'brand_id' => 'required|exists:vehicle_brands,id',
            'model_id' => 'required|exists:vehicle_models,id',
            'plate_number' => 'required|string|max:20',
            'vin_last_4' => 'nullable|string|max:4',
            'color' => 'nullable|string|max:50',
            'year' => 'nullable|integer',
            'current_mileage' => 'nullable|numeric',
        ]);

        return CustomerVehicle::create($validated);
    }

    public function show($id)
    {
        return CustomerVehicle::with(['customer', 'brand', 'model','plate_no'])->findOrFail($id);
    }

    public function update(Request $request, $id)
    {
        $vehicle = CustomerVehicle::findOrFail($id);
        
        $validated = $request->validate([
            'brand_id' => 'sometimes|exists:vehicle_brands,id',
            'model_id' => 'sometimes|exists:vehicle_models,id',
            'plate_number' => 'sometimes|string|max:20',
            'vin_last_4' => 'nullable|string|max:4',
            'color' => 'nullable|string|max:50',
            'year' => 'nullable|integer',
            'current_mileage' => 'nullable|numeric',
        ]);

        $vehicle->update($validated);
        return $vehicle;
    }

    public function destroy($id)
    {
        $vehicle = CustomerVehicle::findOrFail($id);
        // Check if vehicle has job cards
        if ($vehicle->jobCards()->exists()) {
            return response()->json(['message' => 'Cannot delete vehicle with existing job cards'], 422);
        }
        $vehicle->delete();
        return response()->json(['message' => 'Vehicle deleted successfully']);
    }
}
