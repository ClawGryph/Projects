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
            ->map(function ($schedule) {
                return [
                    'id' => $schedule->id,
                    'due_date' => $schedule->due_date ? Carbon::parse($schedule->due_date)->format('Y-m-d') : null,
                    'payment_rate' => $schedule->payment_rate,
                    'expected_amount' => $schedule->expected_amount,
                    'status' => $schedule->status,
                ];
            })
            ->sortBy(fn($s) => $s['due_date'] ?? '9999-99-99')
            ->values();

        return [
            'id' => $this->id,
            'created_at' => $this->created_at,
            'final_price' => $this->final_price,
            'is_vatable' => $this->is_vatable,

            'project' => $this->project ? [
                'id' => $this->project->id,
                'title' => $this->project->title,
                'description' => $this->project->description,
                'price' => $this->project->price,
                'status' => $this->project->status,
                'start_date' => $this->project->start_date ? Carbon::parse($this->project->start_date)->format('Y-m-d') : null,
                'end_date' => $this->project->end_date ? Carbon::parse($this->project->end_date)->format('Y-m-d') : null,
                'created_at' => $this->project->created_at,
            ] : null,

            'payment' => $payment ? [
                'id' => $payment->id,
                'payment_type' => $payment->payment_type,
                'recurring_type' => $payment->recurring_type,
                'number_of_cycles' => $payment->number_of_cycles,
                'fixed_rate' => $payment->fixed_rate,
                'start_date' => $payment->start_date ? Carbon::parse($payment->start_date)->format('Y-m-d') : null,
                'paid_installments_count' => $payment->paymentTransactions->count(),
            ] : null,

            'client' => [
                'id' => $this->client->id,
                'name' => $this->client->name,
                'company_type' => $this->client->company_type,
            ],

            'payment_transaction' => $transaction ? [
                'id' => $transaction->id,
                'amount' => $transaction->amount ?? 0,
                'paid_at' => $transaction->paid_at ? Carbon::parse($transaction->paid_at)->format('Y-m-d') : null,
            ] : [
                'id' => null,
                'amount' => 0,
                'paid_at' => null,
                'installment_number' => null,
            ],

            'payment_schedules' => $schedules,
        ];
    }
}
