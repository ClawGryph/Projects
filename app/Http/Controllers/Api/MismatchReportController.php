<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\Resources\MismatchReportResource;
use App\Models\MismatchReport;
use Illuminate\Http\Request;

class MismatchReportController extends Controller
{
    public function index()
    {
        return MismatchReportResource::collection(MismatchReport::all());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'payment_schedule_id' => 'nullable|exists:payment_schedules,id',
            'transaction_id'      => 'nullable|exists:transactions,id',
            'official_receipt_id' => 'nullable|exists:official_receipts,id',
            'total_paid'          => 'nullable|numeric',
            'total_si'            => 'nullable|numeric',
            'notes'               => 'nullable|string',
        ]);

        $report = MismatchReport::create($validated);

        return new MismatchReportResource($report);
    }

    public function update(Request $request, MismatchReport $mismatchReport)
    {
        $validated = $request->validate([
            'notes'      => 'nullable|string',
            'is_checked' => 'nullable|boolean',
        ]);

        $mismatchReport->update($validated);

        return new MismatchReportResource($mismatchReport);
    }
}
