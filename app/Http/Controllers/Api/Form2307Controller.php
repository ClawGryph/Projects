<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Form2307;
use Illuminate\Http\Request;

class Form2307Controller extends Controller
{
    public function store(Request $request)
    {
        try {
            $request->merge([
                'month1_amount' => $request->month1_amount ?: 0,
                'month2_amount' => $request->month2_amount ?: 0,
                'month3_amount' => $request->month3_amount ?: 0,
                'total_income'  => $request->total_income  ?: 0,
            ]);

            $validated = $request->validate([
                'official_receipt_id' => 'required|exists:official_receipts,id',
                'period_from'         => 'required|string',
                'period_to'           => 'required|string',
                'payee_tin'           => 'required|string',
                'atc_code'            => 'required|string',
                'month1_amount'       => 'sometimes|numeric|min:0',
                'month2_amount'       => 'sometimes|numeric|min:0',
                'month3_amount'       => 'sometimes|numeric|min:0',
                'total_income'        => 'sometimes|numeric|min:0',
                'tax_withheld'        => 'required|numeric|min:0',
            ]);

            $form2307 = Form2307::create($validated);

            return response()->json($form2307, 201);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function update(Request $request, Form2307 $form2307)
    {
        try {
            $request->merge([
                'month1_amount' => $request->month1_amount ?: 0,
                'month2_amount' => $request->month2_amount ?: 0,
                'month3_amount' => $request->month3_amount ?: 0,
                'total_income'  => $request->total_income  ?: 0,
            ]);

            $validated = $request->validate([
                'period_from'   => 'sometimes|string',
                'period_to'     => 'sometimes|string',
                'payee_tin'     => 'sometimes|string',
                'atc_code'      => 'sometimes|string',
                'month1_amount' => 'sometimes|numeric|min:0',
                'month2_amount' => 'sometimes|numeric|min:0',
                'month3_amount' => 'sometimes|numeric|min:0',
                'total_income'  => 'sometimes|numeric|min:0',
                'tax_withheld'  => 'sometimes|numeric|min:0',
            ]);

            $form2307->update($validated);

            return response()->json($form2307);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }
}
