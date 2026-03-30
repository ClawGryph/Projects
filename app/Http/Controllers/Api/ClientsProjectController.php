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
            'payments.paymentSchedules' => function ($query) {
                $query->orderBy('due_date', 'asc');
            },
        ])
            ->where('client_id', $client->id)
            ->orderBy('id', 'desc')
            ->get();

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
            'project_id'                           => 'required|exists:projects,id',
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
        ]);

        // Ensure project belongs to this company
        $project = Project::findOrFail($data['project_id']);
        abort_if($project->company_id !== $this->company()->id, 403);

        $exists = ClientsProject::where('client_id', $clientId)
            ->where('project_id', $data['project_id'])
            ->exists();

        if ($exists) {
            return response()->json([
                'message' => 'This project is already assigned to this client.'
            ], 422);
        }

        $clientsProject = ClientsProject::create([
            'client_id'   => $clientId,
            'project_id'  => $data['project_id'],
            'final_price' => $data['final_price'],
            'vat_type'    => $data['vat_type'],
        ]);

        $startDate = Carbon::parse($data['start_date']);

        $payment = Payment::create([
            'clients_project_id' => $clientsProject->id,
            'company_id'         => $this->company()->id,
            'payment_type'       => $data['payment_type'],
            'recurring_type'     => $data['recurring_type'] ?? null,
            'number_of_cycles'   => $data['number_of_cycles'] ?? null,
            'start_date'         => $startDate,
            'fixed_rate'         => $data['payment_type'] === 'recurring' ? $data['recurring_rate'] : null,
        ]);

        if ($data['payment_type'] === 'one_time') {
            PaymentSchedule::create([
                'payment_id'      => $payment->id,
                'due_date'        => $startDate->format('Y-m-d'),
                'payment_rate'    => 0,
                'expected_amount' => $data['final_price'],
                'status'          => 'pending',
            ]);
        }

        if ($data['payment_type'] === 'installment' && !empty($data['installment_schedule'])) {
            foreach ($data['installment_schedule'] as $schedule) {
                PaymentSchedule::create([
                    'payment_id'      => $payment->id,
                    'due_date'        => $schedule['due_date'],
                    'payment_rate'    => $schedule['payment_rate'],
                    'expected_amount' => ($schedule['payment_rate'] / 100) * $data['final_price'],
                    'status'          => 'pending',
                ]);
            }
        }

        if ($data['payment_type'] === 'recurring' && !empty($data['number_of_cycles']) && $data['recurring_rate']) {
            $currentDate = $startDate->copy();

            for ($i = 0; $i < $data['number_of_cycles']; $i++) {
                PaymentSchedule::create([
                    'payment_id'      => $payment->id,
                    'due_date'        => $currentDate->format('Y-m-d'),
                    'payment_rate'    => $data['recurring_rate'],
                    'expected_amount' => ($data['recurring_rate'] / 100) * $data['final_price'],
                    'status'          => 'pending',
                ]);

                if ($data['recurring_type'] === 'weekly') {
                    $currentDate->addWeek();
                } elseif ($data['recurring_type'] === 'monthly') {
                    $currentDate->addMonth();
                } elseif ($data['recurring_type'] === 'yearly') {
                    $currentDate->addYear();
                }
            }
        }

        return response()->json([
            'message' => 'Project assigned with payment successfully'
        ]);
    }

    public function projectsWithClients()
    {
        $clientsProjects = ClientsProject::with([
            'project',
            'client',
            'payments.paymentSchedules' => function ($query) {
                $query->orderBy('due_date', 'asc');
            },
            'payments.paymentTransactions',
        ])
            // Scope through project → company_id
            ->whereHas('project', function ($q) {
                $q->where('company_id', $this->company()->id);
            })
            ->orderBy('created_at', 'desc')
            ->get();

        return ClientsProjectResource::collection($clientsProjects);
    }
}
