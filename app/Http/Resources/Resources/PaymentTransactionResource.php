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

        'officialReceipt' => $this->officialReceipt ? [
            'id'                             => $this->officialReceipt->id,
            'service_invoice_number'         => $this->officialReceipt->service_invoice_number,
            'payment_acknowledgement_number' => $this->officialReceipt->payment_acknowledgement_number,
            'billing_statement_number'       => $this->officialReceipt->billing_statement_number,
            'or_date'                        => $this->officialReceipt->or_date,
            'base_amount'                    => $this->officialReceipt->base_amount,
            'vat_amount'                     => $this->officialReceipt->vat_amount,
            'total_amount'                   => $this->officialReceipt->total_amount,
            'wh_tax'                         => $this->officialReceipt->wh_tax,
            'other'                          => $this->officialReceipt->other,
            'other_label'                    => $this->officialReceipt->other_label,
            'notes'                          => $this->officialReceipt->notes,
            'or_file_url'                    => $this->officialReceipt->or_file_path
                ? asset('storage/' . $this->officialReceipt->or_file_path)
                : null,
            'form2307_file_url'              => $this->officialReceipt->form2307?->form_file_path
                ? asset('storage/' . $this->officialReceipt->form2307->form_file_path)
                : null,
            'form2307_id'                    => $this->officialReceipt->form2307?->id,
        ] : null,

        'is_or_issued'       => (bool) $this->paymentSchedule?->is_or_issued,
        'is_form2307_issued' => (bool) $this->paymentSchedule?->is_form2307_issued,
        ];
    }
}
