<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\Resources\PaymentTransactionResource;
use App\Models\PaymentTransaction;
use Illuminate\Http\Request;

class PaymentTransactionController extends Controller
{
    private function company(): \App\Models\Company
    {
        return app('company');
    }

    public function index()
    {
        return PaymentTransactionResource::collection(
            PaymentTransaction::with([
                'paymentSchedule.payment.clientsProject.client',
                'paymentSchedule.payment.clientsProject.project',
                'officialReceipt.form2307',
            ])->latest()->where('company_id', $this->company()->id)->get()
        );
    }

    public function destroy(PaymentTransaction $transaction)
    {
        abort_if($transaction->company_id !== $this->company()->id, 403);

        $transaction->officialReceipt()->delete();
        $transaction->delete();

        return response()->noContent();
    }
}
