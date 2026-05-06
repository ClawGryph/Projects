<?php

namespace App\Http\Resources\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Carbon;

class ClientsProjectResource extends JsonResource
{
    public static $wrap = false;

    public function toArray(Request $request): array
    {
        // Get first payment
        $payment = $this->payments->first();

        // Get latest payment transaction across all payments
        $transaction = $this->payments
            ->flatMap->paymentTransactions
            ->sortByDesc('id')
            ->first();

        // Collect all payment schedules across payments
        $schedules = $this->payments
            ->flatMap->paymentSchedules
            ->map(fn($schedule) => new PaymentScheduleResource($schedule))
            ->sortBy(fn($s) => $s['due_date'] ?? '9999-99-99')
            ->values();

        return [
            'id' => $this->id,
            'created_at' => $this->created_at,

            'project'      => $this->project
                ? new ProjectResource($this->project)
                : null,

            'subscription' => $this->subscription
                ? new SubscriptionResource($this->subscription)
                : null,


            'payment' => $payment
                ? new PaymentResource($payment)
                : null,

            'client' => $this->client
                ? new ClientResource($this->client)
                : null,

            'payment_transaction' => $transaction
                ? new PaymentTransactionResource($transaction)
                : [
                    'id'     => null,
                    'amount' => 0,
                    'paid_at' => null,
                    'installment_number' => null,
                ],

            'payment_schedules' => $schedules,
        ];
    }
}
