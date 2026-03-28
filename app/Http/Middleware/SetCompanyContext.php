<?php

namespace App\Http\Middleware;

use App\Models\Company;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SetCompanyContext
{
    public function handle(Request $request, Closure $next)
    {
        $companyId = $request->header('X-Company-Id');

        if (!$companyId) {
            return response()->json(['message' => 'No company selected.'], 422);
        }

        $company = Company::findOrFail($companyId);

        // Security check: ensure this company belongs to the authed user
        // (adjust this to match however your users <-> companies relationship works)
        if (!$request->user()->companies->contains($company->id)) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        app()->instance('company', $company);

        return $next($request);
    }
}
