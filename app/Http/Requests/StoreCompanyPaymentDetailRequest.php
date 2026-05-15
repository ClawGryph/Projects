<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreCompanyPaymentDetailRequest extends FormRequest
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
        return [
            'tin_no'         => 'nullable|string|max:15',
            'tin_name'       => 'nullable|string|max:150',
            'bank_name'      => 'nullable|string|max:150',
            'account_name'   => 'nullable|string|max:150',
            'account_number' => 'nullable|string|max:20',
        ];
    }
}
