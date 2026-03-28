<?php

namespace App\Http\Middleware;

use App\Models\Company;
use Closure;
use Illuminate\Http\Request;

class SetCompanyContext
{
    public function handle(Request $request, Closure $next)
    {
        $companyId = $request->header('X-Company-Id');

        if (!$companyId) {
            return response()->json(['message' => 'No company selected.'], 422);
        }

        $company = Company::find($companyId);

        if (!$company) {
            return response()->json(['message' => 'Company not found.'], 404);
        }

        app()->instance('company', $company);

        return $next($request);
    }
}
