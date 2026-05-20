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
            'manualInvoice',
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

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('form2307_status')) {
            $query->where('is_form2307_issued', $request->form2307_status === 'issued');
        }

        if ($request->filled('service_type') && $request->filled('service_id')) {
            if ($request->service_type === 'project') {
                $query->whereHas('payment.clientsProject', fn($q) =>
                    $q->where('project_id', $request->service_id)
                );
            } else {
                $query->whereHas('payment.clientsProject', fn($q) =>
                    $q->where('subscription_id', $request->service_id)
                );
            }
        } elseif ($request->filled('service_type')) {
            if ($request->service_type === 'project') {
                $query->whereHas('payment.clientsProject', fn($q) =>
                    $q->whereNotNull('project_id')
                );
            } else {
                $query->whereHas('payment.clientsProject', fn($q) =>
                    $q->whereNotNull('subscription_id')
                );
            }
        }

        $sortDirection = $request->get('direction', 'asc');
        $query->orderBy('due_date', $sortDirection);

        // Paginate
        $paginated = $query->paginate(15);
        $schedules = collect($paginated->items());

        // Compute schedule_index and total_schedules
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

        return response()->json([
            'data'       => PaymentScheduleResource::collection($schedules),
            'pagination' => [
                'current_page' => $paginated->currentPage(),
                'last_page'    => $paginated->lastPage(),
                'total'        => $paginated->total(),
                'per_page'     => $paginated->perPage(),
            ],
        ]);
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
            'status'      => 'required|in:paid',
            'paid_amount' => 'required|numeric',
            'wh_tax'      => 'nullable|numeric',
            'paid_at'     => 'required|date',
        ]);

        $schedule->status = 'paid';
        $schedule->save();

        if (!$schedule->transaction()->exists()) {
            $grossAmount = (float) $schedule->total_amount;
            $whTax       = (float) ($request->wh_tax ?? 0);
            $paidAmount  = (float) ($request->paid_amount ?? 0);
            $netAmount   = $grossAmount - $whTax;

            $schedule->paymentTransactions()->create([
                'company_id'   => $this->company()->id,
                'gross_amount' => $grossAmount,
                'wh_tax'       => $whTax,
                'net_amount'   => $netAmount,
                'paid_amount'  => $paidAmount,
                'paid_at'      => $request->paid_at ?? now(),
            ]);
        }

        return response()->json([
            'message' => 'Payment marked as paid successfully.',
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
