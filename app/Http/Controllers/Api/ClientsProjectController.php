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

        $clientsProject = ClientsProject::with([
            'project',
            'subscription',
            'payments',
        ])->where('client_id', $client->id)
        ->findOrFail($projectId);

        return new ClientsProjectResource($clientsProject);
    }

    public function destroy($clientId, $clientsProjectId)
    {
        $client = Client::findOrFail($clientId);
        abort_if($client->company_id !== $this->company()->id, 403);

        $clientsProject = ClientsProject::where('client_id', $clientId)
            ->findOrFail($clientsProjectId);

        // Delete payment schedules through each payment
        $clientsProject->payments()->each(function ($payment) {
            $payment->paymentSchedules()->delete();
            $payment->delete();
        });

        // Delete the clients project record
        $clientsProject->delete();

        return response()->json(['message' => 'Service deleted successfully']);
    }

    public function assignProject(Request $request, $clientId)
    {
        $client = Client::findOrFail($clientId);
        abort_if($client->company_id !== $this->company()->id, 403);

        $data = $request->validate([
            'project_id'              => 'nullable|exists:projects,id',
            'subscription_id'         => 'nullable|exists:subscriptions,id',
            'number_of_cycles'        => 'nullable|integer|min:1',
            'adjusted_start_coverage' => 'nullable|date',
            'adjusted_end_coverage'   => 'nullable|date',
            'cr_no'                   => 'nullable|string',
            'is_renewal'              => 'nullable|boolean',
            'total_cost'              => 'nullable|numeric|min:0',
        ]);

        $project      = isset($data['project_id'])      ? Project::findOrFail($data['project_id'])           : null;
        $subscription = isset($data['subscription_id']) ? Subscription::findOrFail($data['subscription_id']) : null;

        abort_if(
            ($project      && $project->company_id      !== $this->company()->id) ||
            ($subscription && $subscription->company_id !== $this->company()->id),
            403
        );

        // ── RENEWAL ───────────────────────────────────────────────────────────
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
                : now();

            $recurringType  = $subscription->recurring_type ?? null;
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
        ]);

        Payment::create([
            'company_id'         => $this->company()->id,
            'clients_project_id' => $clientsProject->id,
            'number_of_cycles'   => $data['number_of_cycles'] ?? 0,
            'total_cost'         => $data['total_cost'] ?? 0,
        ]);

        return response()->json(['message' => 'Project assigned with payment successfully']);
    }

    public function updateAssignment(Request $request, $clientId, $clientsProjectId)
    {
        $client = Client::findOrFail($clientId);
        abort_if($client->company_id !== $this->company()->id, 403);

        $clientsProject = ClientsProject::findOrFail($clientsProjectId);
        abort_if($clientsProject->client_id != $clientId, 403);

        $data = $request->validate([
            'project_id'       => 'nullable|exists:projects,id',
            'subscription_id'  => 'nullable|exists:subscriptions,id',
            'number_of_cycles' => 'nullable|integer|min:0',
        ]);

        $payment = $clientsProject->payments()->first();
        abort_if(!$payment, 404);

        // Update project/subscription if changed
        $clientsProject->update([
            'project_id'      => $data['project_id']      ?? $clientsProject->project_id,
            'subscription_id' => $data['subscription_id'] ?? $clientsProject->subscription_id,
        ]);

        $payment->update([
            'number_of_cycles' => $data['number_of_cycles'] ?? $payment->number_of_cycles,
        ]);

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
