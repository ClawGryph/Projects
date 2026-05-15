<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\Resources\PaymentScheduleResource;
use App\Models\ClientsProject;
use App\Models\ManualInvoice;
use App\Models\Payment;
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

        if ($request->filled('client_id')) {
            $query->whereHas('payment.clientsProject', function ($q) use ($request) {
                $q->where('client_id', $request->client_id);
            });
        }

        if ($request->filled('project_id')) {
            $query->whereHas('payment.clientsProject.project', function ($q) use ($request) {
                $q->where('id', $request->project_id);
            });
        }

        $sortDirection = $request->get('direction', 'asc');
        $query->orderBy('due_date', $sortDirection);

        $schedules = $query->get();

        $paymentIds = $schedules->pluck('payment_id')->unique();

        $allSchedules = PaymentSchedule::whereIn('payment_id', $paymentIds)
            ->orderBy('due_date', 'asc')
            ->get()
            ->groupBy('payment_id');

        $schedules->each(function ($schedule) use ($allSchedules) {
            $group = $allSchedules->get($schedule->payment_id, collect());
            $schedule->schedule_index = $group->search(fn($s) => $s->id === $schedule->id) + 1;
            $schedule->total_schedules = $group->count();
        });

        return PaymentScheduleResource::collection($schedules);
    }

    public function store(Request $request, $paymentId)
    {
        $payment = Payment::select('id', 'company_id', 'clients_project_id')
            ->findOrFail($paymentId);

        abort_if($payment->company_id !== $this->company()->id, 403);

        $data = $request->validate([
            'schedules'                  => 'required|array|min:1',
            'schedules.*.due_date'       => 'required|date',
            'schedules.*.start_coverage' => 'required|date',
            'schedules.*.end_coverage'   => 'required|date',
            'schedules.*.payment_rate'   => 'required|numeric|min:0',
            'schedules.*.base_amount'    => 'required|numeric|min:0',
            'schedules.*.vat_amount'     => 'required|numeric|min:0',
            'schedules.*.total_amount'   => 'required|numeric|min:0',
        ]);

        $existingDates = PaymentSchedule::where('payment_id', $payment->id)
            ->pluck('start_coverage')
            ->map(fn($d) => \Carbon\Carbon::parse($d)->toDateString())
            ->toArray();

        $schedules = collect($data['schedules'])->filter(function ($s) use ($existingDates) {
            return !in_array(
                \Carbon\Carbon::parse($s['start_coverage'])->toDateString(),
                $existingDates
            );
        })->values()->map(function ($s) use ($payment) {
            return [
                'payment_id'           => $payment->id,
                'due_date'             => $s['due_date'],
                'start_coverage'       => $s['start_coverage'],
                'end_coverage'         => $s['end_coverage'],
                'payment_rate'         => $s['payment_rate'],
                'base_amount'          => $s['base_amount'],
                'vat_amount'           => $s['vat_amount'],
                'total_amount'         => $s['total_amount'],
                'status'               => 'pending',
                'invoice_number'       => null,
                'is_or_issued'         => false,
                'is_form2307_issued'   => false,
                'is_invoice_generated' => false,
                'created_at'           => now(),
                'updated_at'           => now(),
            ];
        });

        if ($schedules->isEmpty()) {
            return response()->json(['message' => 'No new schedules to add.']);
        }

        PaymentSchedule::insert($schedules->toArray());

        $updatedSchedules = PaymentSchedule::where('payment_id', $payment->id)->get();

        Payment::where('id', $payment->id)->update([
            'total_cost'       => $updatedSchedules->sum('total_amount'),
            'number_of_cycles' => $updatedSchedules->count(),
        ]);

        return response()->json(['message' => 'Billing schedule saved successfully.']);
    }

    public function updateStatus(Request $request, PaymentSchedule $schedule)
    {
        abort_if($schedule->payment->company_id !== $this->company()->id, 403);

        $request->validate([
            'status'      => 'required|in:pending,paid,overdue,ended',
            'amount_paid' => 'nullable|numeric',
            'wh_tax'      => 'nullable|numeric',
        ]);

        if ($request->status === 'paid') {
            $clientsProject = $schedule->payment->clientsProject;
            $subscription   = $clientsProject?->subscription;
            $project        = $clientsProject?->project;

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
                    $originalEnd = $subscription->end_coverage;
                    $scheduleEnd = $schedule->end_coverage;
                    $isBeyondOriginal = $originalEnd && $scheduleEnd > $originalEnd;

                    if ($isBeyondOriginal && (!$subscription->adjusted_start_coverage || !$subscription->adjusted_end_coverage)) {
                        return response()->json([
                            'message' => 'Cannot mark as paid. This subscription is missing adjusted coverage dates. Please renew the subscription first.',
                        ], 422);
                    }
                }
            }

            if ($project) {
                $paidCount = PaymentSchedule::whereHas('payment.clientsProject', function ($q) use ($clientsProject) {
                    $q->where('client_id', $clientsProject->client_id)
                    ->where('project_id', $clientsProject->project_id);
                })
                ->where('status', 'paid')
                ->count();

                $isFirstPayment = $paidCount === 0;

                if ($isFirstPayment) {
                    if (!$project->start_date || !$project->end_date) {
                        return response()->json([
                            'message' => 'Cannot mark as paid. This project is missing start and end dates.',
                        ], 422);
                    }
                } else {
                    $originalEnd = $project->end_date;
                    $scheduleEnd = $schedule->end_coverage;
                    $isBeyondOriginal = $originalEnd && $scheduleEnd > $originalEnd;

                    if ($isBeyondOriginal && (!$project->adjusted_start_date || !$project->adjusted_end_date)) {
                        return response()->json([
                            'message' => 'Cannot mark as paid. This project is missing adjusted dates. Please update the project first.',
                        ], 422);
                    }
                }
            }
        }

        $schedule->status = $request->status;
        $schedule->save();

        if ($request->status === 'paid' && !$schedule->transaction()->exists()) {
            $baseGross = $request->amount_paid ?? $schedule->total_amount;

            $clientsProject = $schedule->payment->clientsProject;
            $vatType        = $clientsProject?->vat_type;
            $whTax          = (float) ($request->wh_tax ?? 0);

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

            if ($vatType !== 'vat_other' && $additionalBase > 0) {
                $withholdingRate = $whTax > 0
                    ? $whTax / ($schedule->base_amount ?: 1)
                    : 0;
                $whTax += $additionalBase * $withholdingRate;
            }

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
            'message' => 'Payment schedule status updated successfully',
        ]);
    }

    public function getByPayment($paymentId)
    {
        $payment = Payment::findOrFail($paymentId);
        abort_if($payment->company_id !== $this->company()->id, 403);

        $schedules = PaymentSchedule::where('payment_id', $paymentId)
            ->orderBy('due_date', 'asc')
            ->get();

        return PaymentScheduleResource::collection($schedules);
    }

    public function updateSchedules(Request $request, $paymentId)
    {
        $payment = Payment::with('clientsProject')->findOrFail($paymentId);
        abort_if($payment->company_id !== $this->company()->id, 403);

        $data = $request->validate([
            'schedules'                  => 'required|array|min:1',
            'schedules.*.id'             => 'nullable|integer',
            'schedules.*.due_date'       => 'required|date',
            'schedules.*.start_coverage' => 'required|date',
            'schedules.*.end_coverage'   => 'required|date',
            'schedules.*.payment_rate'   => 'required|numeric|min:0',
            'schedules.*.base_amount'    => 'required|numeric|min:0',
            'schedules.*.vat_amount'     => 'required|numeric|min:0',
            'schedules.*.total_amount'   => 'required|numeric|min:0',
            // ← no status field accepted here
        ]);

        // Delete rows removed by the user
        $incomingIds = collect($data['schedules'])->pluck('id')->filter()->toArray();
        PaymentSchedule::where('payment_id', $paymentId)
            ->whereNotIn('id', $incomingIds)
            ->delete();

        foreach ($data['schedules'] as $s) {
            if (!empty($s['id'])) {
                // Update only — never touch invoice_number or status
                PaymentSchedule::where('id', $s['id'])
                    ->where('payment_id', $paymentId)
                    ->update([
                        'due_date'       => $s['due_date'],
                        'start_coverage' => $s['start_coverage'],
                        'end_coverage'   => $s['end_coverage'],
                        'payment_rate'   => $s['payment_rate'],
                        'base_amount'    => $s['base_amount'],
                        'vat_amount'     => $s['vat_amount'],
                        'total_amount'   => $s['total_amount'],
                        'updated_at'     => now(),
                    ]);
            } else {
                // New row — no invoice_number, invoice is assigned only on generateInvoice()
                PaymentSchedule::create([
                    'payment_id'           => $paymentId,
                    'due_date'             => $s['due_date'],
                    'start_coverage'       => $s['start_coverage'],
                    'end_coverage'         => $s['end_coverage'],
                    'payment_rate'         => $s['payment_rate'],
                    'base_amount'          => $s['base_amount'],
                    'vat_amount'           => $s['vat_amount'],
                    'total_amount'         => $s['total_amount'],
                    'status'               => 'pending',
                    'invoice_number'       => null,  // explicitly no invoice yet
                    'is_or_issued'         => false,
                    'is_form2307_issued'   => false,
                    'is_invoice_generated' => false,
                ]);
            }
        }

        $updatedSchedules = PaymentSchedule::where('payment_id', $paymentId)->get();
        $payment->update([
            'total_cost'       => $updatedSchedules->sum('total_amount'),
            'number_of_cycles' => $updatedSchedules->count(),
        ]);

        return response()->json(['message' => 'Schedules updated successfully.']);
    }

    public function updateAmounts(Request $request, PaymentSchedule $schedule)
    {
        abort_if($schedule->payment->company_id !== $this->company()->id, 403);

        $data = $request->validate([
            'base_amount'  => 'required|numeric|min:0',
            'vat_amount'   => 'required|numeric|min:0',
            'total_amount' => 'required|numeric|min:0',
        ]);

        $schedule->update($data);

        // Recalculate and update the parent Payment's total_cost
        $payment = $schedule->payment;
        if ($payment) {
            $newTotalCost = $payment->paymentSchedules()->sum('total_amount');
            $payment->update(['total_cost' => $newTotalCost]);
        }

        return response()->json(['message' => 'Schedule amounts updated successfully.']);
    }

    public function generateInvoice($paymentId)
    {
        $payment = Payment::with('clientsProject')->findOrFail($paymentId);
        abort_if($payment->company_id !== $this->company()->id, 403);

        $clientId = $payment->clientsProject->client_id;
        $serviceSegment = $payment->clientsProject->project_id
            ? "P{$payment->clientsProject->project_id}"
            : "S{$payment->clientsProject->subscription_id}";

        $schedules = PaymentSchedule::where('payment_id', $paymentId)
            ->orderBy('due_date', 'asc')
            ->get();

        $lastNumber = $schedules
            ->filter(fn($s) => !empty($s->invoice_number))
            ->map(function ($s) {
                if (preg_match('/(\d+)$/', $s->invoice_number, $matches)) {
                    return (int) $matches[1];
                }
                return 0;
            })
            ->max() ?? 0;

        foreach ($schedules as $schedule) {
            $schedule->is_invoice_generated = true;

            if (empty($schedule->invoice_number)) {
                $lastNumber++;
                $formattedIndex = str_pad($lastNumber, 3, '0', STR_PAD_LEFT);
                $schedule->invoice_number = "C{$clientId}{$serviceSegment}-{$formattedIndex}";
            }

            $schedule->save();
        }

        return response()->json(['message' => 'Invoice generated successfully.']);
    }
}
