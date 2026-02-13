<?php

namespace App\Http\Controllers\Api;

use App\Models\Project;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateProjectRequest;
use App\Http\Resources\Resources\ProjectResource;

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
            'payment_type' => 'required',
            'price' => 'required',
            'status' => 'string'
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
        'status' => 'string|in:pending,ongoing,completed'
    ]);

    $project->update([
        'status' => $request->status
    ]);

    return response()->json([
        'message' => 'Status updated successfully'
    ]);
}

}
