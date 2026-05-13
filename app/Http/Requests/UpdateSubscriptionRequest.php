<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateSubscriptionRequest extends FormRequest
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
            'title'                    => 'required|string|max:100',
            'description'              => 'required|string|max:1000',
            'start_coverage'           => 'required|date',
            'end_coverage'             => 'required|date|after_or_equal:start_coverage',
            'cost'                     => 'required|numeric|min:0|decimal:0,2',
            'vat_type'                  => 'required|in:vat_inclusive,vat_exclusive,vat_exempt,vat_other',
            'frequency'                 => 'required|in:monthly,quarterly,half_yearly,yearly',
            'adjusted_start_coverage'  => 'nullable|date|after_or_equal:end_coverage',
            'adjusted_end_coverage'    => [
                                            'nullable',
                                            'date',
                                            'after_or_equal:end_coverage',
                                            Rule::when(
                                                request('adjusted_start_coverage'),
                                                ['after_or_equal:adjusted_start_coverage']
                                            ),
                                        ],
            'billing_start_date' => [
                                        'required',
                                        'date',
                                        'after_or_equal:start_coverage',
                                        'before_or_equal:end_coverage',
                                        Rule::when(request('adjusted_start_coverage'), ['after_or_equal:adjusted_start_coverage']),
                                        Rule::when(request('adjusted_end_coverage'), ['before_or_equal:adjusted_end_coverage']),
                                    ],
                'cr_no'                => [
                                            request('adjusted_start_coverage') || request('adjusted_end_coverage')
                                                ? 'required'
                                                : 'nullable',
                                            'string'
                                        ],
        ];
    }
}
