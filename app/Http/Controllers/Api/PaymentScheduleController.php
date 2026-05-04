<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\Resources\PaymentScheduleResource;
use App\Models\ManualInvoice;
use App\Models\PaymentSchedule;
use Illuminate\Http\Request;

class PaymentScheduleController extends Controller
{
    private function company(): \App\Models\Company
    {
        return app('company');
    }

    public function index(Request $request)
    {
        $query = PaymentSchedule::with([
            'payment.clientsProject.client.clientCompanyType',
            'payment.clientsProject.project',
            'payment.clientsProject.subscription',
            'payment.clientsProject.payments',
            'transaction.officialReceipt.form2307',
        ])
        ->whereHas('payment', function ($q) {
            $q->where('company_id', $this->company()->id);
        });

        if ($request->filled('month')) {
            $query->where('due_date', 'like', $request->month . '%');
        }

        if ($request->filled('project_id')) {
            $query->whereHas('clientsProject.project', function ($q) use ($request) {
                $q->where('id', $request->project_id);
            });
        }

        $sortDirection = $request->get('direction', 'asc');
        $query->orderBy('due_date', $sortDirection);

        $schedules = $query->get();

        // Fetch ALL schedules for the involved payment_ids (ignoring filters)
        $paymentIds = $schedules->pluck('payment_id')->unique();

        $allSchedules = PaymentSchedule::whereIn('payment_id', $paymentIds)
            ->orderBy('due_date', 'asc')
            ->get()
            ->groupBy('payment_id');

        // Attach schedule_index and total_schedules to each result
        $schedules->each(function ($schedule) use ($allSchedules) {
            $group = $allSchedules->get($schedule->payment_id, collect());
            $schedule->schedule_index = $group->search(fn($s) => $s->id === $schedule->id) + 1;
            $schedule->total_schedules = $group->count();
        });

        return PaymentScheduleResource::collection($schedules);
    }

    public function updateStatus(Request $request, PaymentSchedule $schedule)
    {
        abort_if($schedule->payment->company_id !== $this->company()->id, 403);

        $request->validate([
            'status'      => 'required|in:pending,paid,overdue,ended',
            'amount_paid' => 'nullable|numeric',
            'wh_tax'      => 'nullable|numeric',
        ]);

        $schedule->status = $request->status;
        $schedule->save();

        if ($request->status === 'paid' && !$schedule->transaction()->exists()) {
            $baseGross = $request->amount_paid ?? $schedule->total_amount;
            $whTax     = $request->wh_tax ?? 0;

            $manualInvoice = \App\Models\ManualInvoice::where('payment_schedule_id', $schedule->id)->first();
            $additionalTotal = 0;
            $additionalBase = 0;  // ← track base separately for wh_tax

            if ($manualInvoice && !empty($manualInvoice->line_items)) {
                foreach ($manualInvoice->line_items as $item) {
                    if (!empty($item['is_additional'])) {
                        $additionalBase  += (float) ($item['amount'] ?? 0);       // ← base only
                        $additionalTotal += (float) ($item['amount'] ?? 0);
                        $additionalTotal += (float) ($item['vat_amount'] ?? 0);
                    }
                }
            }

            // Recompute wh_tax to include additional items' base
            // wh_tax from request was computed on schedule base_amount only
            // We need to add the withholding on additional items too
            $withholdingRate = $whTax > 0
                ? $whTax / ($schedule->base_amount ?: 1)  // back-calculate rate
                : 0;
            $whTax = $whTax + ($additionalBase * $withholdingRate);

            $grossAmount = $baseGross + $additionalTotal;
            $netAmount   = $grossAmount - $whTax;

            $schedule->paymentTransactions()->create([
                'company_id'   => $this->company()->id,
                'gross_amount' => $grossAmount,
                'wh_tax'       => $whTax,
                'net_amount'   => $netAmount,
                'paid_at'      => now(),
            ]);
        }

        return response()->json([
            'message'  => 'Payment schedule status updated successfully',
            'schedule' => $schedule,
        ]);
    }
}
