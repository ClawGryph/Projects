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

    public function index(Client $client)
    {
        // Ensure client belongs to this company
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
        // Ensure client belongs to this company
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
            'vat_type'                             => 'required|string|in:vat_exempt,vat_exclusive,vat_inclusive',
            'final_price'                          => 'required|numeric|min:0',
            'adjusted_start_coverage'              => 'nullable|date',
            'adjusted_end_coverage'                => 'nullable|date',
            'cr_no'                                => 'nullable|string',
            'is_renewal'                           => 'nullable|boolean',
        ]);

        // Ensure project belongs to this company
        $project = isset($data['project_id']) ? Project::findOrFail($data['project_id']) : null;
        $subscription = isset($data['subscription_id']) ? Subscription::findOrFail($data['subscription_id']) : null;
        abort_if(
                    ($project && $project->company_id !== $this->company()->id) ||
                    ($subscription && $subscription->company_id !== $this->company()->id),
                    403
                );

                if (empty($data['is_renewal'])) {
                $exists = ClientsProject::where('client_id', $clientId)
                            ->when(
                                isset($data['project_id']),
                                fn($q) => $q->where('project_id', $data['project_id']),
                                fn($q) => $q->whereNull('project_id')
                            )
                            ->when(
                                isset($data['subscription_id']),
                                fn($q) => $q->where('subscription_id', $data['subscription_id']),
                                fn($q) => $q->whereNull('subscription_id')
                            )
                            ->exists();

                if ($exists) {
                    return response()->json([
                        'message' => 'This service is already assigned to this client.'
                    ], 422);
                }
        }

        $clientsProject = ClientsProject::create([
            'client_id'   => $clientId,
            'project_id'      => $data['project_id'] ?? null,
            'subscription_id' => $data['subscription_id'] ?? null,
            'final_price' => $data['final_price'],
            'vat_type'    => $data['vat_type'],
        ]);

        $startDate = Carbon::parse($data['start_date']);
        $serviceSegment = isset($data['project_id']) && $data['project_id']
                            ? "P{$data['project_id']}"
                            : "S{$data['subscription_id']}";

        $payment = Payment::create([
            'clients_project_id' => $clientsProject->id,
            'company_id'         => $this->company()->id,
            'payment_type'       => $data['payment_type'],
            'recurring_type'     => $data['recurring_type'] ?? null,
            'number_of_cycles'   => $data['payment_type'] === 'recurring' ? 0 : ($data['number_of_cycles'] ?? null),
            'start_date'         => $startDate,
            'fixed_rate'         => null,
        ]);

        if ($data['payment_type'] === 'one_time') {
            $invoiceNumber = "C{$clientId}{$serviceSegment}-001";
            PaymentSchedule::create([
                'payment_id'      => $payment->id,
                'due_date'        => $startDate->format('Y-m-d'),
                'payment_rate'    => 0,
                'expected_amount' => $data['final_price'],
                'status'          => 'pending',
                'is_or_issued'    => false,
                'is_form2307_issued'    => false,
                'invoice_number'  => $invoiceNumber
            ]);
        }

        if ($data['payment_type'] === 'installment' && !empty($data['installment_schedule'])) {
            foreach ($data['installment_schedule'] as $index => $schedule) {
                $formattedIndex = str_pad($index + 1, 3, '0', STR_PAD_LEFT);
                $invoiceNumber = "C{$clientId}{$serviceSegment}-{$formattedIndex}";
                PaymentSchedule::create([
                    'payment_id'      => $payment->id,
                    'due_date'        => $schedule['due_date'],
                    'payment_rate'    => $schedule['payment_rate'],
                    'expected_amount' => ($schedule['payment_rate'] / 100) * $data['final_price'],
                    'status'          => 'pending',
                    'is_or_issued'    => false,
                    'is_form2307_issued'    => false,
                    'invoice_number'  => $invoiceNumber,
                ]);
            }
        }

        if ($data['payment_type'] === 'recurring' && isset($data['subscription_id']) && $data['subscription_id']) {
            $existingSchedulesCount = PaymentSchedule::whereHas('payment.clientsProject', function ($q) use ($clientId, $data) {
                $q->where('client_id', $clientId)
                ->where('subscription_id', $data['subscription_id']);
            })->count();
            $formattedIndex = str_pad($existingSchedulesCount + 1, 3, '0', STR_PAD_LEFT);
            $invoiceNumber = "C{$clientId}{$serviceSegment}-{$formattedIndex}";
            PaymentSchedule::create([
                'payment_id'         => $payment->id,
                'due_date'           => $startDate->format('Y-m-d'),
                'payment_rate'       => 0,
                'expected_amount'    => $data['final_price'],
                'status'             => 'pending',
                'is_or_issued'       => false,
                'is_form2307_issued' => false,
                'invoice_number'     => $invoiceNumber,
            ]);

        // ── If renewing, update adjusted coverage dates on the subscription ──
            if (!empty($data['is_renewal'])) {

            // ── Capture old values BEFORE updating ──
            $oldStart = $subscription->adjusted_start_coverage
                ? Carbon::parse($subscription->adjusted_start_coverage)->toDateString()
                : $subscription->start_coverage?->toDateString();

            $oldEnd = $subscription->adjusted_end_coverage
                ? Carbon::parse($subscription->adjusted_end_coverage)->toDateString()
                : $subscription->end_coverage?->toDateString();

            // Update adjusted coverage dates on the subscription
            $subscription->update([
                'adjusted_start_coverage' => !empty($data['adjusted_start_coverage'])
                    ? Carbon::parse($data['adjusted_start_coverage'])->toDateString()
                    : $subscription->adjusted_start_coverage,
                'adjusted_end_coverage' => !empty($data['adjusted_end_coverage'])
                    ? Carbon::parse($data['adjusted_end_coverage'])->toDateString()
                    : $subscription->adjusted_end_coverage,
            ]);

            // Log the changes
            $oldValues = [
                'adjusted_start_coverage' => $oldStart,
                'adjusted_end_coverage'   => $oldEnd,
            ];

            foreach (['adjusted_start_coverage', 'adjusted_end_coverage'] as $field) {
                if (empty($data[$field])) continue;

                $old = $oldValues[$field];
                $new = Carbon::parse($data[$field])->toDateString();

                if ($old !== $new) {
                    \App\Models\SubscriptionLog::create([
                        'subscription_id' => $subscription->id,
                        'user_id'         => $request->user()->id,
                        'field'           => $field,
                        'old_value'       => $old,
                        'new_value'       => $new,
                        'cr_no'           => $data['cr_no'] ?? null,
                    ]);
                }
            }

            // Increment number_of_cycles on the previous payment
            $previousClientProject = ClientsProject::where('client_id', $clientId)
                ->where('subscription_id', $data['subscription_id'])
                ->where('id', '!=', $clientsProject->id)
                ->latest('id')
                ->first();

            if ($previousClientProject) {
                $previousClientProject->payments()->latest('id')->first()?->increment('number_of_cycles');
            }
        }
}

        return response()->json([
            'message' => 'Project assigned with payment successfully'
        ]);
    }

    public function updateAssignment(Request $request, $clientId, $clientsProjectId)
{
    $client = Client::findOrFail($clientId);
    abort_if($client->company_id !== $this->company()->id, 403);

    $clientsProject = ClientsProject::findOrFail($clientsProjectId);
    abort_if($clientsProject->client_id != $clientId, 403);

    $data = $request->validate([
        'vat_type'                             => 'required|string|in:vat_exempt,vat_exclusive,vat_inclusive',
        'final_price'                          => 'required|numeric|min:0',
        'installment_schedule'                 => 'nullable|array',
        'installment_schedule.*.id'            => 'nullable|exists:payment_schedules,id',
        'installment_schedule.*.due_date'      => 'required_with:installment_schedule|date',
        'installment_schedule.*.payment_rate'  => 'required_with:installment_schedule|numeric',
        'number_of_cycles'                     => 'nullable|integer|min:1',
    ]);

    $payment = $clientsProject->payments()->first();
    abort_if(!$payment, 404);

    // Update vat_type and final_price on clients_project
    $clientsProject->update([
        'vat_type'    => $data['vat_type'],
        'final_price' => $data['final_price'],
    ]);

    if ($payment->payment_type === 'installment' && !empty($data['installment_schedule'])) {
        $existingSchedules = $payment->paymentSchedules()->orderBy('due_date', 'asc')->get();
        $paidCount = $existingSchedules->where('status', 'paid')->count();
        $newCount = count($data['installment_schedule']);

        // Block if trying to decrease below existing count
        if ($newCount < $existingSchedules->count()) {
            return response()->json([
                'message' => 'Cannot decrease the number of installment months.'
            ], 422);
        }

        $serviceSegment = $clientsProject->project_id
            ? "P{$clientsProject->project_id}"
            : "S{$clientsProject->subscription_id}";

        foreach ($data['installment_schedule'] as $index => $scheduleData) {
            $formattedIndex = str_pad($index + 1, 3, '0', STR_PAD_LEFT);

            if (isset($scheduleData['id'])) {
                // Existing schedule — only update if pending
                $schedule = PaymentSchedule::find($scheduleData['id']);
                if ($schedule && $schedule->status === 'pending') {
                    $schedule->update([
                        'due_date'        => $scheduleData['due_date'],
                        'payment_rate'    => $scheduleData['payment_rate'],
                        'expected_amount' => ($scheduleData['payment_rate'] / 100) * $data['final_price'],
                    ]);
                }
            } else {
                // New schedule row — create it
                $invoiceNumber = "C{$clientId}{$serviceSegment}-{$formattedIndex}";
                PaymentSchedule::create([
                    'payment_id'         => $payment->id,
                    'due_date'           => $scheduleData['due_date'],
                    'payment_rate'       => $scheduleData['payment_rate'],
                    'expected_amount'    => ($scheduleData['payment_rate'] / 100) * $data['final_price'],
                    'status'             => 'pending',
                    'is_or_issued'       => false,
                    'is_form2307_issued' => false,
                    'invoice_number'     => $invoiceNumber,
                ]);
            }
        }

        // Update number_of_cycles on payment
        $payment->update(['number_of_cycles' => $newCount]);
    }

    // For one_time — just recalculate pending schedule expected_amount
    if ($payment->payment_type === 'one_time') {
        $payment->paymentSchedules()
            ->where('status', 'pending')
            ->update(['expected_amount' => $data['final_price']]);
    }

    return response()->json([
        'message' => 'Assignment updated successfully.'
    ]);
}

    public function projectsWithClients()
    {
        $clientsProjects = ClientsProject::with([
            'project',
            'subscription',
            'client',
            'payments.paymentSchedules' => function ($query) {
                $query->orderBy('due_date', 'asc');
            },
            'payments.paymentTransactions',
        ])
            // Scope through project → company_id
            ->where(function ($q) {
                $q->whereHas('project', function ($q) {
                    $q->where('company_id', $this->company()->id);
                })->orWhereHas('subscription', function ($q) {
                    $q->where('company_id', $this->company()->id);
                });
            })
            ->orderBy('created_at', 'desc')
            ->get();

        return ClientsProjectResource::collection($clientsProjects);
    }
}
