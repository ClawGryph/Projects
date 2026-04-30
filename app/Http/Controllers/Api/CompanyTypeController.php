<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CompanyType;
use Illuminate\Http\Request;

class CompanyTypeController extends Controller
{
    public function index()
    {
        return response()->json(CompanyType::orderBy('name')->get());
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:company_types,name',
        ]);

        $companyType = CompanyType::create($validated);

        return response()->json($companyType, 201);
    }

    public function update(Request $request, CompanyType $companyType)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:company_types,name,' . $companyType->id,
        ]);

        $companyType->update($validated);

        return response()->json($companyType);
    }

    public function destroy(CompanyType $companyType)
    {
        $companyType->delete();

        return response()->json(['message' => 'Company type deleted successfully.']);
    }
}
