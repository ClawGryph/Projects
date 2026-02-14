<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\Resources\PaymentResource;
use App\Models\Payment;
use Illuminate\Http\Request;

class PaymentController extends Controller
{
    public function index(Payment $paymet){
        return PaymentResource::collection(
            $payment->query->orderBy('id', 'desc')->get()
        );
    }

    /**
     * Display the specified resource.
     */
    public function show(Payment $payment)
    {
        return new PaymentResource($payment);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'payment_type' => 'required|string',
            'recurring_type' => 'required|string',
            'installments' => 'required|integer',
            'start_date' => 'required'
        ]);


        $payment = Payment::create($data);

        return new PaymentResource($payment);
    }
}
