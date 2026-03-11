<?php

namespace App\Http\Resources\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PaymentScheduleResource extends JsonResource
{
    public static $wrap = false;

    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'due_date' => $this->due_date ? $this->due_date->format('Y-m-d') : null,
            'payment_rate' => $this->payment_rate,
            'expected_amount' => $this->expected_amount,
            'status' => $this->status,

            'clientsProject' => $this->clientsProject ? [
                'id' => $this->clientsProject->id,
                'is_vatable' => $this->clientsProject->is_vatable,
                'final_price' => $this->clientsProject->final_price,

                'client' => $this->clientsProject->client ? [
                    'id' => $this->clientsProject->client->id,
                    'name' => $this->clientsProject->client->name,
                    'company_name' => $this->clientsProject->client->company_name,
                    'company_address' => $this->clientsProject->client->company_address,
                ] : null,

                'project' => $this->clientsProject->project ? [
                    'id' => $this->clientsProject->project->id,
                    'title' => $this->clientsProject->project->title,
                    'start_date' => $this->clientsProject->project->start_date,
                    'end_date' => $this->clientsProject->project->end_date,
                ] : null,

                'payment' => $this->clientsProject && $this->clientsProject->payments->first()
                    ? [
                        'id' => $this->clientsProject->payments->first()->id,
                        'payment_type' => $this->clientsProject->payments->first()->payment_type,
                        'recurring_type' => $this->clientsProject->payments->first()->recurring_type,
                    ]
                    : null,
            ] : null,

            'transaction' => $this->transaction ? [
                'id'          => $this->transaction->id,
                'amount_paid' => $this->transaction->amount_paid,
                'paid_at'     => $this->transaction->paid_at,
                'officialReceipt' => $this->transaction->officialReceipt ? [
                    'id'                     => $this->transaction->officialReceipt->id,
                    'or_number'              => $this->transaction->officialReceipt->or_number,
                    'or_date'                => $this->transaction->officialReceipt->or_date,
                    'service_invoice_number' => $this->transaction->officialReceipt->service_invoice_number,
                    'amount'                 => $this->transaction->officialReceipt->amount,
                    'vat_amount'             => $this->transaction->officialReceipt->vat_amount,
                    'other'                  => $this->transaction->officialReceipt->other,
                    'total_amount'           => $this->transaction->officialReceipt->total_amount,
                    'form_2307_status'       => $this->transaction->officialReceipt->form_2307_status,
                ] : null,
            ] : null,
        ];
    }
}
