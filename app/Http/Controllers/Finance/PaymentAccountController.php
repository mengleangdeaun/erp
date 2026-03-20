<?php

namespace App\Http\Controllers\Finance;

use App\Http\Controllers\Controller;
use App\Models\Finance\PaymentAccount;
use Illuminate\Http\Request;

class PaymentAccountController extends Controller
{
    public function index(Request $request)
    {
        $query = PaymentAccount::with('branch');

        if ($request->has('branch_id')) {
            $query->where('branch_id', $request->branch_id);
        }

        if ($request->has('status')) {
            $query->where('is_active', $request->status === 'active');
        }

        if ($request->has('all')) {
            return $query->get();
        }

        return $query->paginate($request->input('per_page', 10));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'account_no' => 'nullable|string|max:255',
            'branch_id' => 'required|exists:branches,id',
            'balance' => 'nullable|numeric',
            'is_active' => 'nullable|boolean',
        ]);

        $account = PaymentAccount::create($validated);

        return response()->json($account, 201);
    }

    public function show(PaymentAccount $paymentAccount)
    {
        return $paymentAccount->load('branch');
    }

    public function update(Request $request, PaymentAccount $paymentAccount)
    {
        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'account_no' => 'nullable|string|max:255',
            'branch_id' => 'sometimes|required|exists:branches,id',
            'balance' => 'nullable|numeric',
            'is_active' => 'nullable|boolean',
        ]);

        $paymentAccount->update($validated);

        return response()->json($paymentAccount);
    }

    public function destroy(PaymentAccount $paymentAccount)
    {
        $paymentAccount->delete();

        return response()->json(null, 204);
    }
}
