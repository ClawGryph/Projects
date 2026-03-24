<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class RoleMiddleware
{
    public function handle(Request $request, Closure $next, ...$roles)
    {
        $user = $request->user();

        \Log::info('Authenticated user: ', ['id' => $user?->id, 'email' => $user?->email]);
        \Log::info('Required roles: ', $roles);
        \Log::info('User roles: ', $user?->roles->pluck('name')->toArray() ?? []);

        if (! $user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        foreach ($roles as $role) {
            if ($user->hasRole($role)) {
                return $next($request);
            }
        }

        return response()->json([
            'message' => 'Forbidden. You do not have permission.',
        ], 403);
    }
}
