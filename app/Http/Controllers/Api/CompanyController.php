<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\Resources\CompanyResource;
use App\Models\Company;
use Illuminate\Http\Request;

class CompanyController extends Controller
{
    public function index(){
        return CompanyResource::collection(
            Company::query()->orderBy('id', 'desc')->get()
        );
    }

    public function store(Request $request){
        $data = $request->validate([
            'name' => 'required|string|max:50',
            'business_type' => 'nullable|string|max:100',
            'vat_type' => 'required|string|in:vat_registered,non_vat',
            'annual_gross' => 'required|numeric'
        ]);

        $company = Company::create($data);

        return new CompanyResource($company);
    }

    public function show(Company $company){
        return new CompanyResource($company);
    }
}
