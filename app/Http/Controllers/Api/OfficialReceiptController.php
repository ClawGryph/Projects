<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\Resources\OfficialReceiptResource;
use App\Models\OfficialReceipt;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class OfficialReceiptController extends Controller
{
    public function index()
    {
        return OfficialReceiptResource::collection(
            OfficialReceipt::with('form2307')->latest()->get()
        );
    }

    public function show(OfficialReceipt $officialReceipt)
    {
        return new OfficialReceiptResource($officialReceipt->load('form2307'));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'payment_transaction_id'         => 'required|exists:payment_transactions,id',
            'or_date'                        => 'required|date',
            'service_invoice_number'         => 'nullable|string|unique:official_receipts,service_invoice_number',
            'payment_acknowledgement_number' => 'nullable|string|unique:official_receipts,payment_acknowledgement_number',
            'billing_statement_number'       => 'nullable|string|unique:official_receipts,billing_statement_number',
            'amount'                         => 'required|numeric',
            'vat_amount'                     => 'nullable|numeric',
            'other'                          => 'nullable|numeric',
            'other_label'                    => 'nullable|string',
            'total_amount'                   => 'nullable|numeric',
            'notes'                          => 'nullable|string',
        ]);

        $or = OfficialReceipt::create($validated);

        return new OfficialReceiptResource($or->load('form2307'));
    }

    public function update(Request $request, $id)
    {
        $validated = $request->validate([
            'or_date'                        => 'required|date',
            'service_invoice_number'         => ['nullable', 'string', Rule::unique('official_receipts', 'service_invoice_number')->ignore($id)],
            'payment_acknowledgement_number' => ['nullable', 'string', Rule::unique('official_receipts', 'payment_acknowledgement_number')->ignore($id)],
            'billing_statement_number'       => ['nullable', 'string', Rule::unique('official_receipts', 'billing_statement_number')->ignore($id)],
            'amount'                         => 'required|numeric',
            'vat_amount'                     => 'nullable|numeric',
            'other'                          => 'nullable|numeric',
            'other_label'                    => 'nullable|string',
            'total_amount'                   => 'nullable|numeric',
            'notes'                          => 'nullable|string',
        ]);

        $or = OfficialReceipt::findOrFail($id);
        $or->update($validated);

        return new OfficialReceiptResource($or->load('form2307'));
    }

    public function checkServiceInvoiceNumber(Request $request): JsonResponse
    {
        $request->validate(['number' => 'required|string']);

        $query = OfficialReceipt::where('service_invoice_number', $request->number);

        if ($request->filled('exclude_id')) {
            $query->where('id', '!=', $request->exclude_id);
        }

        return response()->json(['available' => !$query->exists()]);
    }

    public function checkPaymentAcknowledgementNumber(Request $request): JsonResponse
    {
        $request->validate(['number' => 'required|string']);

        $query = OfficialReceipt::where('payment_acknowledgement_number', $request->number);

        if ($request->filled('exclude_id')) {
            $query->where('id', '!=', $request->exclude_id);
        }

        return response()->json(['available' => !$query->exists()]);
    }

    public function checkBillingStatementNumber(Request $request): JsonResponse
    {
        $request->validate(['number' => 'required|string']);

        $query = OfficialReceipt::where('billing_statement_number', $request->number);

        if ($request->filled('exclude_id')) {
            $query->where('id', '!=', $request->exclude_id);
        }

        return response()->json(['available' => !$query->exists()]);
    }
}
