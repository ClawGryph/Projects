<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\Resources\ClientsProjectResource;
use App\Http\Resources\Resources\ProjectResource;
use App\Models\Client;
use App\Models\ClientsProject;
use App\Models\Payment;
use App\Models\PaymentSchedule;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class ClientsProjectController extends Controller
{
    /**
     * List all projects for a specific client.
     */
    public function index(Client $client)
    {
        $clientProjects = ClientsProject::with(['project', 'payments.paymentSchedules' => function($query) {
                                                    $query->orderBy('due_date', 'asc');
                                                },])
            ->where('client_id', $client->id)
            ->orderBy('id', 'desc')
            ->get();

        return ClientsProjectResource::collection($clientProjects);
    }

    /**
    * Show a specific project for this client
    */
    public function show(Client $client, $projectId)
    {
        $project = $client->projects()->findOrFail($projectId);
        return new ProjectResource($project);
    }

    public function assignProject(Request $request, $clientId)
    {
        $data = $request->validate([
            'project_id' => 'required|exists:projects,id',
            'payment_type' => 'required|string',
            'recurring_type' => 'nullable|string',
            'number_of_cycles' => 'nullable|integer|min:1',
            'start_date' => 'required|date',
            'installment_schedule' => 'nullable|array',
            'installment_schedule.*.due_date' => 'required_with:installment_schedule|date',
            'installment_schedule.*.payment_rate' => 'required_with:installment_schedule|numeric',
            'recurring_rate' => 'nullable|numeric',
        ]);

        $exists = ClientsProject::where('client_id', $clientId)
                ->where('project_id', $data['project_id'])
                ->exists();

        if ($exists) {
            return response()->json([
                'message' => 'This project is already assigned to this client.'
            ], 422);
        }

        // CREATE CLIENT PROJECT RECORD
        $clientsProject = ClientsProject::create([
            'client_id' => $clientId,
            'project_id' => $data['project_id']
        ]);

        // COMPUTE NEXT PAYMENT DATE
        $startDate = Carbon::parse($data['start_date']);

        // CREATE PAYMENT RECORD
        $payment = Payment::create([
            'clients_project_id' => $clientsProject->id,
            'payment_type' => $data['payment_type'],
            'recurring_type' => $data['recurring_type'] ?? null,
            'number_of_cycles' => $data['number_of_cycles'] ?? null,
            'start_date' => $startDate,
            'fixed_rate' => $data['payment_type'] === 'recurring' ? $data['recurring_rate'] : null,
        ]);

        $projectPrice = $clientsProject->project->price;

        // Only create schedules if payment is installment
        if ($data['payment_type'] === 'one_time') {
            PaymentSchedule::create([
                'payment_id' => $payment->id,
                'due_date' => $startDate->format('Y-m-d'),
                'payment_rate' => 0,
                'expected_amount' => $projectPrice,
                'status' => 'pending',
            ]);
        }

        // Only create schedules if payment is installment
        if ($data['payment_type'] === 'installment' && !empty($data['installment_schedule'])) {
            foreach ($data['installment_schedule'] as $schedule) {
                PaymentSchedule::create([
                    'payment_id' => $payment->id,
                    'due_date' => $schedule['due_date'],
                    'payment_rate' => $schedule['payment_rate'],
                    'expected_amount' => ($schedule['payment_rate'] / 100) * $projectPrice,
                    'status' => 'pending',
                ]);
            }
        }

        // Create schedules for recurring payments
        if ($data['payment_type'] === 'recurring' && !empty($data['number_of_cycles']) && $data['recurring_rate']) {
            $currentDate = $startDate->copy();

            for ($i = 0; $i < $data['number_of_cycles']; $i++) {
                PaymentSchedule::create([
                    'payment_id' => $payment->id,
                    'due_date' => $currentDate->format('Y-m-d'),
                    'payment_rate' => $data['recurring_rate'],
                    'expected_amount' => ($data['recurring_rate'] / 100) * $projectPrice,
                    'status' => 'pending',
                ]);

                // Then increment date for next payment
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
            ->orderBy('created_at', 'desc')
            ->get();

        return ClientsProjectResource::collection($clientsProjects);
    }

}
