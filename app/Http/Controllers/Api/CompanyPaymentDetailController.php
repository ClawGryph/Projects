<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreCompanyPaymentDetailRequest;
use App\Http\Requests\UpdateCompanyPaymentDetailRequest;
use App\Models\CompanyPaymentDetail;
use Illuminate\Http\Request;

class CompanyPaymentDetailController extends Controller
{
    public function index()
    {
        $details = CompanyPaymentDetail::all();

        return response()->json(['data' => $details]);
    }

    public function store(StoreCompanyPaymentDetailRequest $request)
    {
        $detail = CompanyPaymentDetail::create($request->validated());

        return response()->json(['data' => $detail], 201);
    }

    public function show(CompanyPaymentDetail $companyPaymentDetail)
    {
        return response()->json(['data' => $companyPaymentDetail]);
    }

    public function update(UpdateCompanyPaymentDetailRequest $request, CompanyPaymentDetail $companyPaymentDetail)
    {
        $companyPaymentDetail->update($request->validated());

        return response()->json(['data' => $companyPaymentDetail]);
    }

    public function destroy(CompanyPaymentDetail $companyPaymentDetail)
    {
        $companyPaymentDetail->delete();

        return response()->json(['message' => 'Payment detail deleted successfully.']);
    }
}
