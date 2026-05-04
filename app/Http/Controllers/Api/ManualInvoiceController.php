<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ManualInvoice;
use Illuminate\Http\Request;

class ManualInvoiceController extends Controller
{
    public function show(Request $request)
    {
        $request->validate([
            'schedule_id' => 'required|exists:payment_schedules,id',
        ]);

        $invoice = ManualInvoice::where(
            'payment_schedule_id', $request->schedule_id
        )->first();

        return response()->json(['data' => $invoice], 200);
    }

    public function save(Request $request)
    {
        $validated = $request->validate([
            'payment_schedule_id'      => 'required|exists:payment_schedules,id',
            'line_items'               => 'nullable|array',
            'line_items.*.description' => 'nullable|string',
            'line_items.*.note'        => 'nullable|string',
            'line_items.*.qty'         => 'nullable|numeric|min:0',
            'line_items.*.unitPrice'   => 'nullable|numeric|min:0',
            'line_items.*.amount'      => 'nullable|numeric|min:0',
            'line_items.*.vat_amount'  => 'nullable|numeric|min:0',
            'line_items.*.is_additional' => 'nullable|boolean',
        ]);

        $invoice = ManualInvoice::updateOrCreate(
            ['payment_schedule_id' => $validated['payment_schedule_id']],
            ['line_items'          => $validated['line_items'] ?? []],
        );

        return response()->json(['data' => $invoice], 200);
    }
}
