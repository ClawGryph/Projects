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
            OfficialReceipt::latest()->get()
        );
    }

    public function show(OfficialReceipt $officialReceipt)
    {
        return new OfficialReceiptResource($officialReceipt);
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
        ]);

        $or = OfficialReceipt::create($validated);
        return new OfficialReceiptResource($or);
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
        ]);

        $or = OfficialReceipt::findOrFail($id);
        $or->update($validated);
        return new OfficialReceiptResource($or);
    }
}
