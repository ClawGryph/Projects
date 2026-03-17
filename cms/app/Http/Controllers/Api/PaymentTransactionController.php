<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\Resources\PaymentTransactionResource;
use App\Models\PaymentTransaction;
use Illuminate\Http\Request;

class PaymentTransactionController extends Controller
{
    public function index()
    {
        return PaymentTransactionResource::collection(
            PaymentTransaction::with([
                'paymentSchedule.payment.clientsProject.client',
                'paymentSchedule.payment.clientsProject.project',
                'officialReceipt.form2307',
            ])->latest()->get()
        );
    }

    public function destroy(PaymentTransaction $transaction)
    {
        $transaction->officialReceipt()->delete();
        $transaction->delete();

        return response()->noContent();
    }
}
