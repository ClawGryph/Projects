<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\Resources\OfficialReceiptResource;
use App\Models\OfficialReceipt;
use Illuminate\Http\Request;

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

    private function get2307Rules(): array
    {
        return [
            'form_2307.period_from'   => 'required_if:form_2307_status,issued|nullable|date',
            'form_2307.period_to'     => 'required_if:form_2307_status,issued|nullable|date',
            'form_2307.payee_tin'     => 'required_if:form_2307_status,issued|nullable|string',
            'form_2307.atc_code'      => 'required_if:form_2307_status,issued|nullable|string',
            'form_2307.month1_amount' => 'sometimes|nullable|numeric|min:0',
            'form_2307.month2_amount' => 'sometimes|nullable|numeric|min:0',
            'form_2307.month3_amount' => 'sometimes|nullable|numeric|min:0',
            'form_2307.total_income'  => 'sometimes|nullable|numeric|min:0',
            'form_2307.tax_withheld'  => 'required_if:form_2307_status,issued|nullable|numeric|min:0',
        ];
    }

    private function prepare2307Data(array $raw): array
    {
        $raw['month1_amount'] = $raw['month1_amount'] ?: 0;
        $raw['month2_amount'] = $raw['month2_amount'] ?: 0;
        $raw['month3_amount'] = $raw['month3_amount'] ?: 0;
        $raw['total_income']  = $raw['total_income']  ?: 0;
        return $raw;
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'payment_transaction_id' => 'required|exists:payment_transactions,id',
            'or_number'              => 'nullable|string',
            'or_date'                => 'required|date',
            'service_invoice_number' => 'nullable|string',
            'amount'                 => 'required|numeric',
            'vat_amount'             => 'nullable|numeric',
            'other'                  => 'nullable|numeric',
            'total_amount'           => 'nullable|numeric',
            'form_2307_status'       => 'nullable|in:pending,issued',
            ...$this->get2307Rules(),
        ]);

        $or = OfficialReceipt::create($validated);

        if (($validated['form_2307_status'] ?? 'pending') === 'issued' && !empty($validated['form_2307'])) {
            $or->form2307()->create($this->prepare2307Data($validated['form_2307']));
        }

        return new OfficialReceiptResource($or->load('form2307'));
    }

    public function update(Request $request, $id)
    {
        $validated = $request->validate([
            'or_number'              => 'nullable|string',
            'or_date'                => 'required|date',
            'service_invoice_number' => 'nullable|string',
            'amount'                 => 'required|numeric',
            'vat_amount'             => 'nullable|numeric',
            'other'                  => 'nullable|numeric',
            'total_amount'           => 'nullable|numeric',
            'form_2307_status'       => 'nullable|in:pending,issued',
            ...$this->get2307Rules(),
        ]);

        $or = OfficialReceipt::findOrFail($id);
        $or->update($validated);

        if (($validated['form_2307_status'] ?? 'pending') === 'issued' && !empty($validated['form_2307'])) {
            $or->form2307()->updateOrCreate(
                ['official_receipt_id' => $or->id],
                $this->prepare2307Data($validated['form_2307'])
            );
        } else {
            $or->form2307()->delete();
        }

        return new OfficialReceiptResource($or->load('form2307'));
    }

    public function checkServiceInvoiceNumber(Request $request)
    {
        $request->validate(['number' => 'required|string']);

        $query = OfficialReceipt::where('service_invoice_number', $request->number);

        if ($request->filled('exclude_id')) {
            $query->where('id', '!=', $request->exclude_id);
        }

        return response()->json(['available' => !$query->exists()]);
    }
}
