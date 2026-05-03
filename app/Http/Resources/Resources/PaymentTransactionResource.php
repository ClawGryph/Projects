<?php

namespace App\Http\Resources\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PaymentTransactionResource extends JsonResource
{
    public static $wrap = false;

    public function toArray(Request $request): array
    {
        return [
            'company_id' => $this->company_id,
            'id'          => $this->id,
            'net_amount' => $this->net_amount,
            'gross_amount' => $this->gross_amount,
            'vat_amount' => $this->vat_amount,
            'wh_tax'      => $this->wh_tax,
            'paid_at'     => $this->paid_at->format('Y-m-d'),
            'client' => [
                'name' => $this->paymentSchedule?->payment?->clientsProject?->client?->name,
            ],
            'project' => $this->paymentSchedule?->payment?->clientsProject?->project
    ? [
        'id'    => $this->paymentSchedule->payment->clientsProject->project->id,
        'title' => $this->paymentSchedule->payment->clientsProject->project->title,
    ]
    : null,

'subscription' => $this->paymentSchedule?->payment?->clientsProject?->subscription
    ? [
        'id'    => $this->paymentSchedule->payment->clientsProject->subscription->id,
        'title' => $this->paymentSchedule->payment->clientsProject->subscription->title,
    ]
    : null,
            'payment' => [
                'payment_type'   => $this->paymentSchedule?->payment?->payment_type,
                'recurring_type' => $this->paymentSchedule?->payment?->recurring_type,
                'total_amount'=> $this->paymentSchedule?->total_amount,
            ],
            'official_receipt' => $this->officialReceipt ? [
                'id'                             => $this->officialReceipt->id,
                'service_invoice_number'         => $this->officialReceipt->service_invoice_number,
                'payment_acknowledgement_number' => $this->officialReceipt->payment_acknowledgement_number,
                'billing_statement_number'       => $this->officialReceipt->billing_statement_number,
                'or_file_url'                    => $this->officialReceipt->or_file_path
                                                    ? asset('storage/' . $this->officialReceipt->or_file_path)
                                                    : null,
                'form2307_id'                    => $this->officialReceipt->form2307?->id,
                'form2307_file_url'              => $this->officialReceipt->form2307?->form_file_path
                                                    ? asset('storage/' . $this->officialReceipt->form2307->form_file_path)
                                                    : null,
            ] : null,
        ];
    }
}
