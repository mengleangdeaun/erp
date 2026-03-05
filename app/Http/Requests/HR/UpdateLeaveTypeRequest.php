<?php

namespace App\Http\Requests\HR;

use Illuminate\Foundation\Http\FormRequest;

class UpdateLeaveTypeRequest extends FormRequest
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
        $id = $this->route('leave_type') ? $this->route('leave_type')->id : null;
        return [
            'name' => 'required|string|max:255|unique:leave_types,name,' . $id,
            'description' => 'nullable|string',
            'max_per_year' => 'nullable|integer|min:0',
            'is_paid' => 'boolean',
            'color' => 'nullable|string|max:50',
            'status' => 'boolean',
        ];
    }
}
