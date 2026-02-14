<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\Resources\PaymentResource;
use App\Models\Payment;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class PaymentController extends Controller
{
    public function index()
    {
        return PaymentResource::collection(
            Payment::latest()->get()
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

    public function updateStatus(Payment $payment, Request $request)
    {
        $request->validate([
            'status' => 'required|string',
        ]);

        $status = $request->status;
        $payment->status = $status;

        // If recurring and set to active
        if ($payment->payment_type === 'recurring' && $status === 'active') {
            switch ($payment->recurring_type) {
                case 'weekly':
                    $payment->next_payment_date = Carbon::parse($payment->next_payment_date)->addWeek();
                    break;
                case 'monthly':
                    $payment->next_payment_date = Carbon::parse($payment->next_payment_date)->addMonth();
                    break;
                case 'yearly':
                    $payment->next_payment_date = Carbon::parse($payment->next_payment_date)->addYear();
                    break;
            }
        }

        // If installment and set to partial
        if ($payment->payment_type === 'installment' && $status === 'partial') {
            if ($payment->current_installment < $payment->installments) {
                $payment->current_installment += 1;
                $payment->next_payment_date = Carbon::parse($payment->next_payment_date)->addMonth();
            } else {
                $payment->next_payment_date = null; // No more payments
            }
        }

        $payment->save();

        return response()->json([
            'message' => 'Payment status updated',
            'payment' => $payment,
        ]);
    }
}
