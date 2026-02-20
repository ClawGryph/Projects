<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\Resources\PaymentScheduleResource;
use App\Models\PaymentSchedule;
use Illuminate\Http\Request;

class PaymentScheduleController extends Controller
{
    public function index()
    {
        return PaymentScheduleResource::collection(
            PaymentSchedule::latest()->get()
        );
    }
}
