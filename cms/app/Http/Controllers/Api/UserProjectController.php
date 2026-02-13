<?php

namespace App\Http\Controllers\Api;

use App\Models\User;
use App\Models\Project;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use App\Http\Resources\Resources\ProjectResource;
use App\Http\Resources\Resources\UsersProjectResource;

class UserProjectController extends Controller
{
    /**
     * List all projects for a specific user.
     */
    public function index(User $user)
    {
        return ProjectResource::collection(
            $user->projects()->orderBy('id', 'desc')->get()
        );
    }

    /**
    * Show a specific project for this user
    */
    public function show(User $user, $projectId)
    {
        $project = $user->projects()->findOrFail($projectId);
        return new ProjectResource($project);
    }

    public function assignProject(Request $request, User $user)
    {
        $request->validate([
            'project_id' => 'required|exists:projects,id',
        ]);

        $projectId = $request->project_id;

        $user->projects()->syncWithoutDetaching([$projectId]);

        return response()->json([
            'message' => 'Project assigned successfully',
        ]);
    }

    public function projectsWithClients()
    {
        $projects = Project::with('users')
            ->whereHas('users')
            ->get();

        return UsersProjectResource::collection($projects);
    }

}
