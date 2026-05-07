<?php

namespace App\Http\Resources\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PaymentTransactionResource extends JsonResource
{
    public static $wrap = false;

    public function toArray(Request $request): array
{
    $clientsProject = $this->paymentSchedule?->payment?->clientsProject;
    $project        = $clientsProject?->project;
    $subscription   = $clientsProject?->subscription;
    $client         = $clientsProject?->client;
    $payment        = $this->paymentSchedule?->payment;

    return [
        'company_id'   => $this->company_id,
        'id'           => $this->id,
        'net_amount'   => $this->net_amount,
        'gross_amount' => $this->gross_amount,
        'vat_amount'   => $this->vat_amount,
        'wh_tax'       => $this->wh_tax,
        'paid_at'      => $this->paid_at?->format('Y-m-d'),

        'client' => $client ? [
            'id'   => $client->id,
            'name' => $client->name,
        ] : null,

        'project' => $project ? [
            'id'           => $project->id,
            'title'        => $project->title,
            'payment_type' => $project->payment_type,
            'vat_type'     => $project->vat_type,
        ] : null,

        'subscription' => $subscription ? [
            'id'        => $subscription->id,
            'title'     => $subscription->title,
            'frequency' => $subscription->frequency,
            'vat_type'  => $subscription->vat_type,
        ] : null,

        'payment' => $payment ? [
            'id'               => $payment->id,
            'number_of_cycles' => $payment->number_of_cycles,
            'fixed_rate'       => $payment->fixed_rate,
            'total_cost'       => $payment->total_cost,
            'payment_type'     => $project?->payment_type ?? $subscription?->frequency ?? null,
        ] : null,

        'official_receipt' => $this->officialReceipt ? [
            'id'                            => $this->officialReceipt->id,
            'service_invoice_number'        => $this->officialReceipt->service_invoice_number,
            'payment_acknowledgement_number' => $this->officialReceipt->payment_acknowledgement_number,
            'billing_statement_number'      => $this->officialReceipt->billing_statement_number,
            'or_file_url'                   => $this->officialReceipt->or_file_url,
            'form2307_file_url'             => $this->officialReceipt->form2307_file_url,
        ] : null,
    ];
}
}
