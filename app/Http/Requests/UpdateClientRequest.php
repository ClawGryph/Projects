<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateClientRequest extends FormRequest
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
            'name' => 'required|string|max:55',
            'email' => 'required|email|unique:clients,email,'.$this->id,
            'phone_number' => 'required|string|max:20',
            'company_name' => 'required|string|max:55',
            'company_address' => 'required|string|max:100',
            'company_type_id' => 'required|exists:company_types,id',
        ];
    }
}
