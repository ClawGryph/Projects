<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\Resources\ClientsProjectResource;
use App\Http\Resources\Resources\ProjectResource;
use App\Models\Client;
use App\Models\ClientsProject;
use App\Models\Payment;
use App\Models\PaymentSchedule;
use App\Models\Project;
use App\Models\Subscription;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class ClientsProjectController extends Controller
{
    private function company(): \App\Models\Company
    {
        return app('company');
    }

    /**
     * Calculate base_amount, vat_amount, and total_amount for a single schedule row.
     *
     * vat_exclusive — price does NOT yet include VAT, add 12% on top:
     *   base   = price
     *   vat    = price × 0.12
     *   total  = price × 1.12
     *
     * vat_inclusive — price ALREADY contains 12% VAT, back-calculate:
     *   base   = price ÷ 1.12
     *   vat    = price − (price ÷ 1.12)
     *   total  = price          (unchanged)
     *
     * vat_exempt — no VAT at all:
     *   base   = price
     *   vat    = 0
     *   total  = price
     *
     * @return array{base_amount: float, vat_amount: float, total_amount: float}
     */
    private function calcVat(float $price, string $vatType): array
    {
        return match ($vatType) {
            'vat_exclusive' => [
                'base_amount'  => $price,
                'vat_amount'   => round($price * 0.12, 2),
                'total_amount' => round($price * 1.12, 2),
            ],
            'vat_inclusive' => [
                'base_amount'  => round($price / 1.12, 2),
                'vat_amount'   => round($price - ($price / 1.12), 2),
                'total_amount' => $price,
            ],
            default => [          // vat_exempt & vat_other
                'base_amount'  => $price,
                'vat_amount'   => 0,
                'total_amount' => $price,
            ],
        };
    }

    // -------------------------------------------------------------------------

    public function index(Client $client)
    {
        abort_if($client->company_id !== $this->company()->id, 403);

        $clientProjects = ClientsProject::with([
            'project',
            'subscription',
            'payments.paymentSchedules' => function ($query) {
                $query->orderBy('due_date', 'asc');
            },
        ])
            ->where('client_id', $client->id)
            ->orderBy('id', 'desc')
            ->paginate(15);

        return ClientsProjectResource::collection($clientProjects);
    }

    public function show(Client $client, $projectId)
    {
        abort_if($client->company_id !== $this->company()->id, 403);

        $project = $client->projects()->findOrFail($projectId);
        return new ProjectResource($project);
    }

    public function assignProject(Request $request, $clientId)
{
    $client = Client::findOrFail($clientId);
    abort_if($client->company_id !== $this->company()->id, 403);

    $data = $request->validate([
        'project_id'                           => 'nullable|exists:projects,id',
        'subscription_id'                      => 'nullable|exists:subscriptions,id',
        'payment_type'                         => 'required|string',
        'recurring_type'                       => 'nullable|string',
        'number_of_cycles'                     => 'nullable|integer|min:1',
        'start_date'                           => 'required|date',
        'installment_schedule'                 => 'nullable|array',
        'installment_schedule.*.due_date'      => 'required_with:installment_schedule|date',
        'installment_schedule.*.payment_rate'  => 'required_with:installment_schedule|numeric',
        'recurring_rate'                       => 'nullable|numeric',
        'vat_type'                             => 'required|string|in:vat_exempt,vat_exclusive,vat_inclusive,vat_other',
        'final_price'                          => 'required|numeric|min:0',
        'adjusted_start_coverage'              => 'nullable|date',
        'adjusted_end_coverage'                => 'nullable|date',
        'cr_no'                                => 'nullable|string',
        'is_renewal'                           => 'nullable|boolean',
    ]);

    $project      = isset($data['project_id'])      ? Project::findOrFail($data['project_id'])           : null;
    $subscription = isset($data['subscription_id']) ? Subscription::findOrFail($data['subscription_id']) : null;

    abort_if(
        ($project      && $project->company_id      !== $this->company()->id) ||
        ($subscription && $subscription->company_id !== $this->company()->id),
        403
    );

    $startDate      = Carbon::parse($data['start_date']);
    $vatType        = $data['vat_type'];
    $finalPrice     = (float) $data['final_price'];
    $serviceSegment = isset($data['project_id']) && $data['project_id']
        ? "P{$data['project_id']}"
        : "S{$data['subscription_id']}";

    // ── RENEWAL: just update coverage, no new records ─────────────────────
    if (!empty($data['is_renewal'])) {
        $clientsProject = ClientsProject::where('client_id', $clientId)
            ->where('subscription_id', $data['subscription_id'])
            ->latest('id')
            ->firstOrFail();

        $payment = $clientsProject->payments()->latest('id')->firstOrFail();

        $prevAdjustedEnd = $subscription->adjusted_end_coverage
            ? Carbon::parse($subscription->adjusted_end_coverage)
            : ($subscription->end_coverage ? Carbon::parse($subscription->end_coverage) : null);

        $newAdjustedStart = $prevAdjustedEnd
            ? $prevAdjustedEnd->copy()->addDay()
            : $startDate;

        $recurringType  = $data['recurring_type'] ?? $subscription->recurring_type ?? null;
        $newAdjustedEnd = match ($recurringType) {
            'weekly'  => $newAdjustedStart->copy()->addWeek()->subDay(),
            'monthly' => $newAdjustedStart->copy()->addMonth()->subDay(),
            'yearly'  => $newAdjustedStart->copy()->addYear()->subDay(),
            default   => $newAdjustedStart->copy()->addMonth()->subDay(),
        };

        $oldStart = $subscription->adjusted_start_coverage
            ? Carbon::parse($subscription->adjusted_start_coverage)->toDateString()
            : $subscription->start_coverage?->toDateString();

        $oldEnd = $subscription->adjusted_end_coverage
            ? Carbon::parse($subscription->adjusted_end_coverage)->toDateString()
            : $subscription->end_coverage?->toDateString();

        $subscription->update([
            'adjusted_start_coverage' => $newAdjustedStart->toDateString(),
            'adjusted_end_coverage'   => $newAdjustedEnd->toDateString(),
        ]);

        $newValues = [
            'adjusted_start_coverage' => $newAdjustedStart->toDateString(),
            'adjusted_end_coverage'   => $newAdjustedEnd->toDateString(),
        ];
        $oldValues = [
            'adjusted_start_coverage' => $oldStart,
            'adjusted_end_coverage'   => $oldEnd,
        ];

        foreach (['adjusted_start_coverage', 'adjusted_end_coverage'] as $field) {
            if ($oldValues[$field] !== $newValues[$field]) {
                \App\Models\SubscriptionLog::create([
                    'subscription_id' => $subscription->id,
                    'user_id'         => $request->user()->id,
                    'field'           => $field,
                    'old_value'       => $oldValues[$field],
                    'new_value'       => $newValues[$field],
                    'cr_no'           => $data['cr_no'] ?? null,
                ]);
            }
        }

        $payment->increment('number_of_cycles');

        return response()->json(['message' => 'Subscription renewed successfully.']);
    }

    // ── NEW ASSIGNMENT ────────────────────────────────────────────────────
    $exists = ClientsProject::where('client_id', $clientId)
        ->when(isset($data['project_id']),
            fn($q) => $q->where('project_id', $data['project_id']),
            fn($q) => $q->whereNull('project_id')
        )
        ->when(isset($data['subscription_id']),
            fn($q) => $q->where('subscription_id', $data['subscription_id']),
            fn($q) => $q->whereNull('subscription_id')
        )
        ->exists();

    if ($exists) {
        return response()->json([
            'message' => 'This service is already assigned to this client.'
        ], 422);
    }

    $clientsProject = ClientsProject::create([
        'client_id'       => $clientId,
        'project_id'      => $data['project_id']      ?? null,
        'subscription_id' => $data['subscription_id'] ?? null,
        'final_price'     => $data['final_price'],
        'vat_type'        => $data['vat_type'],
    ]);

    $payment = Payment::create([
        'clients_project_id' => $clientsProject->id,
        'company_id'         => $this->company()->id,
        'payment_type'       => $data['payment_type'],
        'recurring_type'     => $data['recurring_type'] ?? null,
        'number_of_cycles'   => $data['payment_type'] === 'recurring' ? 0 : ($data['number_of_cycles'] ?? null),
        'start_date'         => $startDate,
        'fixed_rate'         => null,
    ]);

    // ── ONE-TIME ─────────────────────────────────────────────────────────
    if ($data['payment_type'] === 'one_time') {
        $vat = $this->calcVat($finalPrice, $vatType);

        PaymentSchedule::create([
            'payment_id'         => $payment->id,
            'due_date'           => $startDate->format('Y-m-d'),
            'payment_rate'       => 0,
            'base_amount'        => $vat['base_amount'],
            'vat_amount'         => $vat['vat_amount'],
            'total_amount'       => $vat['total_amount'],
            'status'             => 'pending',
            'is_or_issued'       => false,
            'is_form2307_issued' => false,
            'invoice_number'     => "C{$clientId}{$serviceSegment}-001",
        ]);
    }

    // ── INSTALLMENT ───────────────────────────────────────────────────────
    if ($data['payment_type'] === 'installment' && !empty($data['installment_schedule'])) {
        foreach ($data['installment_schedule'] as $index => $schedule) {
            $slicePrice     = ($schedule['payment_rate'] / 100) * $finalPrice;
            $vat            = $this->calcVat($slicePrice, $vatType);
            $formattedIndex = str_pad($index + 1, 3, '0', STR_PAD_LEFT);

            PaymentSchedule::create([
                'payment_id'         => $payment->id,
                'due_date'           => $schedule['due_date'],
                'payment_rate'       => $schedule['payment_rate'],
                'base_amount'        => $vat['base_amount'],
                'vat_amount'         => $vat['vat_amount'],
                'total_amount'       => $vat['total_amount'],
                'status'             => 'pending',
                'is_or_issued'       => false,
                'is_form2307_issued' => false,
                'invoice_number'     => "C{$clientId}{$serviceSegment}-{$formattedIndex}",
            ]);
        }
    }

    // ── RECURRING (first-time only) ───────────────────────────────────────
    if ($data['payment_type'] === 'recurring' && isset($data['subscription_id']) && $data['subscription_id']) {
        $existingSchedulesCount = PaymentSchedule::whereHas('payment.clientsProject', function ($q) use ($clientId, $data) {
            $q->where('client_id', $clientId)
              ->where('subscription_id', $data['subscription_id']);
        })->count();

        $subStartCoverage = $subscription->start_coverage
            ? Carbon::parse($subscription->start_coverage)
            : $startDate;

        $vat = $this->calcVat($finalPrice, $vatType);

        PaymentSchedule::create([
            'payment_id'         => $payment->id,
            'due_date'           => $subStartCoverage->format('Y-m-d'),
            'payment_rate'       => 0,
            'base_amount'        => $vat['base_amount'],
            'vat_amount'         => $vat['vat_amount'],
            'total_amount'       => $vat['total_amount'],
            'status'             => 'pending',
            'is_or_issued'       => false,
            'is_form2307_issued' => false,
            'invoice_number'     => "C{$clientId}{$serviceSegment}-" . str_pad($existingSchedulesCount + 1, 3, '0', STR_PAD_LEFT),
        ]);
    }

    return response()->json(['message' => 'Project assigned with payment successfully']);
}

    public function updateAssignment(Request $request, $clientId, $clientsProjectId)
    {
        $client = Client::findOrFail($clientId);
        abort_if($client->company_id !== $this->company()->id, 403);

        $clientsProject = ClientsProject::findOrFail($clientsProjectId);
        abort_if($clientsProject->client_id != $clientId, 403);

        $data = $request->validate([
            'vat_type'                             => 'required|string|in:vat_exempt,vat_exclusive,vat_inclusive,vat_other',
            'final_price'                          => 'required|numeric|min:0',
            'installment_schedule'                 => 'nullable|array',
            'installment_schedule.*.id'            => 'nullable|exists:payment_schedules,id',
            'installment_schedule.*.due_date'      => 'required_with:installment_schedule|date',
            'installment_schedule.*.payment_rate'  => 'required_with:installment_schedule|numeric',
            'number_of_cycles'                     => 'nullable|integer|min:1',
        ]);

        $payment = $clientsProject->payments()->first();
        abort_if(!$payment, 404);

        $vatType    = $data['vat_type'];
        $finalPrice = (float) $data['final_price'];

        $clientsProject->update([
            'vat_type'    => $vatType,
            'final_price' => $finalPrice,
        ]);

        // ── INSTALLMENT ───────────────────────────────────────────────────────
        if ($payment->payment_type === 'installment' && !empty($data['installment_schedule'])) {
            $existingSchedules = $payment->paymentSchedules()->orderBy('due_date', 'asc')->get();
            $newCount          = count($data['installment_schedule']);

            if ($newCount < $existingSchedules->count()) {
                return response()->json([
                    'message' => 'Cannot decrease the number of installment months.'
                ], 422);
            }

            $serviceSegment = $clientsProject->project_id
                ? "P{$clientsProject->project_id}"
                : "S{$clientsProject->subscription_id}";

            foreach ($data['installment_schedule'] as $index => $scheduleData) {
                $slicePrice     = ($scheduleData['payment_rate'] / 100) * $finalPrice;
                $vat            = $this->calcVat($slicePrice, $vatType);
                $formattedIndex = str_pad($index + 1, 3, '0', STR_PAD_LEFT);

                if (isset($scheduleData['id'])) {
                    $schedule = PaymentSchedule::find($scheduleData['id']);
                    if ($schedule && $schedule->status === 'pending') {
                        $schedule->update([
                            'due_date'     => $scheduleData['due_date'],
                            'payment_rate' => $scheduleData['payment_rate'],
                            'base_amount'  => $vat['base_amount'],
                            'vat_amount'   => $vat['vat_amount'],
                            'total_amount' => $vat['total_amount'],
                        ]);
                    }
                } else {
                    PaymentSchedule::create([
                        'payment_id'         => $payment->id,
                        'due_date'           => $scheduleData['due_date'],
                        'payment_rate'       => $scheduleData['payment_rate'],
                        'base_amount'        => $vat['base_amount'],
                        'vat_amount'         => $vat['vat_amount'],
                        'total_amount'       => $vat['total_amount'],
                        'status'             => 'pending',
                        'is_or_issued'       => false,
                        'is_form2307_issued' => false,
                        'invoice_number'     => "C{$clientId}{$serviceSegment}-{$formattedIndex}",
                    ]);
                }
            }

            $payment->update(['number_of_cycles' => $newCount]);
        }

        // ── ONE-TIME & RECURRING — recalculate all pending schedules ──────────
        if (in_array($payment->payment_type, ['one_time', 'recurring'])) {
            $vat = $this->calcVat($finalPrice, $vatType);

            $payment->paymentSchedules()
                ->where('status', 'pending')
                ->update([
                    'base_amount'  => $vat['base_amount'],
                    'vat_amount'   => $vat['vat_amount'],
                    'total_amount' => $vat['total_amount'],
                ]);
        }

        return response()->json([
            'message' => 'Assignment updated successfully.'
        ]);
    }

    public function projectsWithClients()
    {
        $companyId = $this->company()->id;

        $clientsProjects = ClientsProject::with([
            'project',
            'subscription',
            'client',
            'payments.paymentSchedules' => function ($query) {
                $query->orderBy('due_date', 'asc');
            },
            'payments.paymentTransactions',
        ])
            ->where(function ($q) use ($companyId) {
                $q->whereHas('project', function ($q) use ($companyId) {
                    $q->where('company_id', $companyId);
                })->orWhereHas('subscription', function ($q) use ($companyId) {
                    $q->where('company_id', $companyId);
                });
            })
            ->orderBy('created_at', 'desc')
            ->get();

        return ClientsProjectResource::collection($clientsProjects);
    }
}
