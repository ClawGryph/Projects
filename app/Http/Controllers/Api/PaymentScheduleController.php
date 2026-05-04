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

        // ── SUBSCRIPTION COVERAGE DATE VALIDATION ─────────────────────────────
        if ($request->status === 'paid') {
            $clientsProject = $schedule->payment->clientsProject;
            $subscription   = $clientsProject?->subscription;

            if ($subscription) {
                $paidCount = PaymentSchedule::whereHas('payment.clientsProject', function ($q) use ($clientsProject) {
                    $q->where('client_id', $clientsProject->client_id)
                    ->where('subscription_id', $clientsProject->subscription_id);
                })
                ->where('status', 'paid')
                ->count();

                $isFirstPayment = $paidCount === 0;

                if ($isFirstPayment) {
                    if (!$subscription->start_coverage || !$subscription->end_coverage) {
                        return response()->json([
                            'message' => 'Cannot mark as paid. This subscription is missing start and end coverage dates.',
                        ], 422);
                    }
                } else {
                    if (!$subscription->adjusted_start_coverage || !$subscription->adjusted_end_coverage) {
                        return response()->json([
                            'message' => 'Cannot mark as paid. This subscription is missing adjusted coverage dates. Please renew the subscription first.',
                        ], 422);
                    }
                }
            }
        }

        $schedule->status = $request->status;
        $schedule->save();

        if ($request->status === 'paid' && !$schedule->transaction()->exists()) {
            $baseGross = $request->amount_paid ?? $schedule->total_amount;
            $whTax     = $request->wh_tax ?? 0;

            $manualInvoice   = ManualInvoice::where('payment_schedule_id', $schedule->id)->first();
            $additionalTotal = 0;
            $additionalBase  = 0;

            if ($manualInvoice && !empty($manualInvoice->line_items)) {
                foreach ($manualInvoice->line_items as $item) {
                    if (!empty($item['is_additional'])) {
                        $additionalBase  += (float) ($item['amount'] ?? 0);
                        $additionalTotal += (float) ($item['amount'] ?? 0);
                        $additionalTotal += (float) ($item['vat_amount'] ?? 0);
                    }
                }
            }

            $withholdingRate = $whTax > 0
                ? $whTax / ($schedule->base_amount ?: 1)
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

            // ── AUTO-CREATE NEXT SCHEDULE FOR SUBSCRIPTIONS ───────────────────
            $clientsProject = $schedule->payment->clientsProject;
            $subscription   = $clientsProject?->subscription;

            if ($subscription) {
                $hasNextSchedule = PaymentSchedule::whereHas('payment.clientsProject', function ($q) use ($clientsProject) {
                    $q->where('client_id', $clientsProject->client_id)
                    ->where('subscription_id', $clientsProject->subscription_id);
                })
                ->where('status', 'pending')
                ->where('due_date', '>', $schedule->due_date)
                ->exists();

                if (!$hasNextSchedule) {
                    $endCoverage = $subscription->adjusted_end_coverage
                        ? \Illuminate\Support\Carbon::parse($subscription->adjusted_end_coverage)
                        : ($subscription->end_coverage
                            ? \Illuminate\Support\Carbon::parse($subscription->end_coverage)
                            : null);

                    $recurringType = $schedule->payment->recurring_type ?? 'monthly';

                    $nextDueDate = $endCoverage
                        ? $endCoverage->copy()->addDay()
                        : match ($recurringType) {
                            'weekly' => \Illuminate\Support\Carbon::parse($schedule->due_date)->addWeek(),
                            'yearly' => \Illuminate\Support\Carbon::parse($schedule->due_date)->addYear(),
                            default  => \Illuminate\Support\Carbon::parse($schedule->due_date)->addMonth(),
                        };

                    $existingCount = PaymentSchedule::whereHas('payment.clientsProject', function ($q) use ($clientsProject) {
                        $q->where('client_id', $clientsProject->client_id)
                        ->where('subscription_id', $clientsProject->subscription_id);
                    })->count();

                    $clientId       = $clientsProject->client_id;
                    $serviceSegment = "S{$clientsProject->subscription_id}";
                    $invoiceNumber  = "C{$clientId}{$serviceSegment}-" . str_pad($existingCount + 1, 3, '0', STR_PAD_LEFT);

                    PaymentSchedule::create([
                        'payment_id'         => $schedule->payment_id,
                        'due_date'           => $nextDueDate->format('Y-m-d'),
                        'payment_rate'       => 0,
                        'base_amount'        => $schedule->base_amount,
                        'vat_amount'         => $schedule->vat_amount,
                        'total_amount'       => $schedule->total_amount,
                        'status'             => 'pending',
                        'is_or_issued'       => false,
                        'is_form2307_issued' => false,
                        'invoice_number'     => $invoiceNumber,
                    ]);
                }
            }
        }

        return response()->json([
            'message'  => 'Payment schedule status updated successfully',
            'schedule' => $schedule,
        ]);
    }
}
