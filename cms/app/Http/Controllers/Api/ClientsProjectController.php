<?php

namespace App\Http\Controllers\Api;

use App\Models\Client;
use App\Models\Project;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use App\Http\Resources\Resources\ProjectResource;
use App\Http\Resources\Resources\ClientsProjectResource;

class ClientsProjectController extends Controller
{
    /**
     * List all projects for a specific client.
     */
    public function index(Client $client)
    {
        return ProjectResource::collection(
            $client->projects()->orderBy('id', 'desc')->get()
        );
    }

    /**
    * Show a specific project for this client
    */
    public function show(Client $client, $projectId)
    {
        $project = $client->projects()->findOrFail($projectId);
        return new ProjectResource($project);
    }

    public function assignProject(Request $request, Client $client)
    {
        $request->validate([
            'project_id' => 'required|exists:projects,id',
        ]);

        $projectId = $request->project_id;

        $client->projects()->syncWithoutDetaching([$projectId]);

        return response()->json([
            'message' => 'Project assigned successfully',
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
