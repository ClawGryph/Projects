<?php

namespace App\Http\Requests;


use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateProjectRequest extends FormRequest
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
            'title'                => 'required|string|max:50',
            'description'          => 'required|string|max:1000',
            'start_date'           => 'required|date',
            'end_date'             => 'required|date|after_or_equal:start_date',
            'price'                => 'required|numeric|min:0|decimal:0,2',
            'adjusted_start_date'  => 'nullable|date|after_or_equal:end_date',
            'adjusted_end_date'    => [
                                        'nullable',
                                        'date',
                                        'after_or_equal:end_date',
                                        Rule::when(
                                            request('adjusted_start_date'),
                                            ['after_or_equal:adjusted_start_date']
                                        ),
                                    ],
            'cr_no'                => [
                                        request('adjusted_start_date') || request('adjusted_end_date')
                                            ? 'required'
                                            : 'nullable',
                                        'string'
                                    ],
        ];
    }
}
