<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreServiceTypeRequest;
use App\Http\Requests\UpdateServiceTypeRequest;
use App\Models\ServiceType;

class ServiceTypeController extends Controller
{
    public function index()
    {
        return response()->json(ServiceType::orderBy('type')->get());
    }

    public function store(StoreServiceTypeRequest $request)
    {
        $serviceType = ServiceType::create($request->validated());

        return response()->json($serviceType, 201);
    }

    public function update(UpdateServiceTypeRequest $request, ServiceType $serviceType)
    {
        $serviceType->update($request->validated());

        return response()->json($serviceType);
    }

    public function destroy(ServiceType $serviceType)
    {
        $serviceType->delete();

        return response()->json(['message' => 'Service type deleted successfully.']);
    }
}
