<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreUserRequest;
use App\Http\Requests\UpdateUserRequest;
use App\Http\Resources\Resources\UserResource;
use App\Models\Role;
use App\Models\User;
use Illuminate\Http\Request;

class UserController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        return UserResource::collection(
            User::with('roles')
                ->orderBy('id', 'desc')
                ->paginate(10)
        );
    }

    public function store(StoreUserRequest $request)
    {
        $data = $request->validated();
        $data['password'] = bcrypt($data['password']);

        $role = Role::where('name', $data['role_name'])->firstOrFail();
        unset($data['role_name']);

        $user = User::create($data);
        $user->roles()->sync([$role->id]);

        return response(new UserResource($user), 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(User $user)
    {
        return new UserResource($user);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateUserRequest $request, User $user)
    {
        $data = $request->validated();
        if(isset($data['password'])){
            $data['password'] = bcrypt($data['password']);
        }

        $roleName = $data['role_name'] ?? null;
        unset($data['role_name']);

        $user->update($data);

        if ($roleName) {
            $role = Role::where('name', $roleName)->firstOrFail();
            $user->roles()->sync([$role->id]);
        }

        return new UserResource($user);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(User $user)
    {
        $user->delete();

        return response('', 204);
    }
}
