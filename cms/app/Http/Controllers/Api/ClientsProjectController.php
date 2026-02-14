<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\Resources\ClientsProjectResource;
use App\Http\Resources\Resources\ProjectResource;
use App\Models\Client;
use App\Models\ClientsProject;
use App\Models\Payment;
use App\Models\Project;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class ClientsProjectController extends Controller
{
    /**
     * List all projects for a specific client.
     */
    public function index(Client $client)
    {
        $clientProjects = ClientsProject::with(['project', 'payments'])
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
            'installments' => 'nullable|integer',
            'start_date' => 'required|date'
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
        $nextPaymentDate = null;
        $currentInstallment = null;


        if ($data['payment_type'] === 'recurring') {

            if ($data['recurring_type'] === 'weekly') {
                $nextPaymentDate = $startDate->copy()->addWeek();
            }

            if ($data['recurring_type'] === 'monthly') {
                $nextPaymentDate = $startDate->copy()->addMonth();
            }

            if ($data['recurring_type'] === 'yearly') {
                $nextPaymentDate = $startDate->copy()->addYear();
            }
        }

        if ($data['payment_type'] === 'installment' && $data['installments']) {
            $currentInstallment = 1;
            $nextPaymentDate = $startDate->copy()->addMonth();
        }

        // CREATE PAYMENT RECORD
        Payment::create([
            'clients_project_id' => $clientsProject->id,
            'payment_type' => $data['payment_type'],
            'recurring_type' => $data['recurring_type'] ?? null,
            'installments' => $data['installments'] ?? null,
            'current_installment' => $currentInstallment,
            'start_date' => $startDate,
            'next_payment_date' => $nextPaymentDate,
            'status' => 'pending'
        ]);

        return response()->json([
            'message' => 'Project assigned with payment successfully'
        ]);
    }

    public function projectsWithClients()
    {
        $projects = Project::with('clients')
            ->whereHas('clients')
            ->get();

        return ClientsProjectResource::collection($projects);
    }

}
