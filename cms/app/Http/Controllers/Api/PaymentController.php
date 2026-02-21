<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\Resources\PaymentResource;
use App\Models\Payment;
use App\Models\PaymentTransaction;
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

        // Safely get project price
        $project = $payment->project;
        if (!$project) {
            return response()->json([
                'message' => 'Linked project not found'
            ], 404);
        }

        $price = $project->price;

        // ONE-TIME PAYMENT
        if ($payment->payment_type === 'one_time' && $status === 'paid') {
            PaymentTransaction::create([
                'payment_id' => $payment->id,
                'amount' => $price,
                'paid_at' => now(),
                'installment_number' => null,
            ]);
        }

        // INSTALLMENT PAYMENT
        if ($payment->payment_type === 'installment' && $status === 'partial') {
            $payment->current_installment = $payment->current_installment ?? 0;
            $payment->current_installment += 1;

            $amount = $price / $payment->installments;

            PaymentTransaction::create([
                'payment_id' => $payment->id,
                'amount' => $amount,
                'paid_at' => now(),
                'installment_number' => $payment->current_installment,
            ]);

            if ($payment->current_installment >= $payment->installments) {
                $payment->status = 'paid';
                $payment->next_payment_date = null;
            } else {
                $payment->next_payment_date = $payment->next_payment_date
                    ? Carbon::parse($payment->next_payment_date)->addMonth()
                    : Carbon::parse($payment->start_date)->addMonth();
            }
        }

        // RECURRING PAYMENT
        if ($payment->payment_type === 'recurring' && $status === 'active') {
            PaymentTransaction::create([
                'payment_id' => $payment->id,
                'amount' => $price,
                'paid_at' => now(),
                'installment_number' => null,
            ]);

            switch ($payment->recurring_type) {
                case 'weekly':
                    $payment->next_payment_date = $payment->next_payment_date
                        ? Carbon::parse($payment->next_payment_date)->addWeek()
                        : Carbon::parse($payment->start_date)->addWeek();
                    break;
                case 'monthly':
                    $payment->next_payment_date = $payment->next_payment_date
                        ? Carbon::parse($payment->next_payment_date)->addMonth()
                        : Carbon::parse($payment->start_date)->addMonth();
                    break;
                case 'yearly':
                    $payment->next_payment_date = $payment->next_payment_date
                        ? Carbon::parse($payment->next_payment_date)->addYear()
                        : Carbon::parse($payment->start_date)->addYear();
                    break;
            }
        }

    $payment->save();

    return response()->json([
        'message' => 'Payment status updated',
        'payment' => new PaymentResource($payment),
    ]);
}

}
