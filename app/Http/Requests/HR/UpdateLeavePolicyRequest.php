<?php

namespace App\Http\Requests\HR;

use Illuminate\Foundation\Http\FormRequest;

class UpdateLeavePolicyRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $id = $this->route('leave_policy') ? $this->route('leave_policy')->id : null;
        return [
            'name' => 'required|string|max:255|unique:leave_policies,name,' . $id,
            'description' => 'nullable|string',
            'leave_type_id' => 'required|exists:leave_types,id',
            'accrual_type' => 'required|in:fixed,monthly,yearly',
            'accrual_rate' => 'required|numeric|min:0',
            'carry_forward_limit' => 'nullable|integer|min:0',
            'min_days_per_app' => 'nullable|integer|min:1',
            'max_days_per_app' => 'nullable|integer|min:0',
            'require_approval' => 'boolean',
            'status' => 'boolean',
        ];
    }
}
