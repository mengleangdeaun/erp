<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use App\Services\DocumentNumberService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CustomerController extends Controller
{
    protected $numberService;

    public function __construct(DocumentNumberService $numberService)
    {
        $this->numberService = $numberService;
    }

    public function index(Request $request)
    {
        $query = Customer::with('type');

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('customer_no', 'like', "%{$search}%")
                  ->orWhere('customer_code', 'like', "%{$search}%");
            });
        }

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        if ($request->has('customer_type_id')) {
            $query->where('customer_type_id', $request->customer_type_id);
        }

        return $query->latest()->paginate($request->per_page ?? 15);
    }

    public function store(Request $request)
    {
        // Auto-generate customer_code if not provided
        if (!$request->has('customer_code') || empty($request->customer_code)) {
            $lastCode = Customer::max('customer_code');
            $request->merge(['customer_code' => $lastCode ? (int)$lastCode + 1 : 1]);
        }

        $validated = $request->validate([
            'customer_code' => 'required|string|max:50|unique:customers,customer_code',
            'name' => 'nullable|string|max:255',
            'phone' => 'required|string|max:20',
            'email' => 'nullable|email|max:255',
            'address' => 'nullable|string',
            'telegram_user_id' => 'nullable|string|max:50',
            'joined_at' => 'nullable|date',
            'customer_type_id' => 'required|exists:customer_types,id',
            'status' => 'required|in:ACTIVE,INACTIVE',
            'notes' => 'nullable|string',
        ]);

        return DB::transaction(function () use ($validated) {
            $validated['customer_no'] = $this->numberService->generate('customer');
            $validated['joined_at'] = $validated['joined_at'] ?? now();
            
            return Customer::create($validated);
        });
    }

    public function show(Customer $customer)
    {
        return $customer->load('type');
    }

    public function update(Request $request, Customer $customer)
    {
        $validated = $request->validate([
            'customer_code' => 'required|string|max:50|unique:customers,customer_code,' . $customer->id,
            'name' => 'nullable|string|max:255',
            'phone' => 'required|string|max:20',
            'email' => 'nullable|email|max:255',
            'address' => 'nullable|string',
            'telegram_user_id' => 'nullable|string|max:50',
            'joined_at' => 'nullable|date',
            'customer_type_id' => 'required|exists:customer_types,id',
            'status' => 'required|in:ACTIVE,INACTIVE',
            'notes' => 'nullable|string',
        ]);

        $customer->update($validated);
        return $customer->load('type');
    }

    public function destroy(Customer $customer)
    {
        $customer->delete();
        return response()->json(null, 204);
    }

    public function getNextCode()
    {
        $lastCode = Customer::max('customer_code');
        return response()->json([
            'next_code' => $lastCode ? (int)$lastCode + 1 : 1
        ]);
    }
}
