<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateProjectRequest;
use App\Http\Resources\Resources\ClientsProjectResource;
use App\Http\Resources\Resources\ProjectResource;
use App\Models\Project;
use Illuminate\Http\Request;

class ProjectController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        return ProjectResource::collection(
            Project::query()->orderBy('id', 'desc')->paginate(10)
        );
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'title' => 'required|string|max:50',
            'description' => 'required|max:200',
            'start_date' => 'required',
            'end_date' => 'required',
            'price' => 'required',
            'status' => 'nullable|string|in:pending,ongoing,complete'
        ]);


        $project = Project::create($data);

        return new ProjectResource($project);
    }

    /**
     * Display the specified resource.
     */
    public function show(Project $project)
    {
        return new ProjectResource($project);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateProjectRequest $request, Project $project)
    {
        $data = $request->validated();
        $project->update($data);

        return new ProjectResource($project);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Project $project)
    {
        $project->delete();

        return response('', 204);
    }

    public function updateStatus(Request $request, Project $project)
    {
        $request->validate([
            'status' => 'required|string|in:pending,ongoing,complete'
        ]);

        $project->update([
            'status' => $request->status
        ]);

        return response()->json([
            'message' => 'Status updated successfully'
        ]);
    }

    public function payments(Project $project)
    {
        return ClientsProjectResource::collection(
        $project->clientsProjects()
            ->with([
                'project',
                'client',
                'payments.paymentSchedules',
                'payments.paymentTransactions'
            ])
            ->get()
    );
    }

}
