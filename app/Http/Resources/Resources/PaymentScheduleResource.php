<?php

namespace App\Http\Resources\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PaymentScheduleResource extends JsonResource
{
    public static $wrap = false;

    public function toArray(Request $request): array
    {
        $clientsProject = $this->payment?->clientsProject;

        return [
            'id' => $this->id,
            'payment_id'     => $this->payment_id,
            'schedule_index'   => $this->schedule_index,
            'total_schedules'  => $this->total_schedules,
            'due_date' => $this->due_date ? $this->due_date->format('Y-m-d') : null,
            'payment_rate' => $this->payment_rate,
            'base_amount' => $this->base_amount,
            'total_amount' => $this->total_amount,
            'vat_amount' => $this->vat_amount,
            'status' => $this->status,
            'invoice_number' => $this->invoice_number,
            'is_or_issued' => $this->is_or_issued,
            'is_form2307_issued' => $this->is_form2307_issued,

            'clientsProject' => $clientsProject ? [
                'id' => $this->clientsProject->id,
                'vat_type' => $this->clientsProject->vat_type,
                'final_price' => $this->clientsProject->final_price,

                'client' => $this->clientsProject->client ? [
                    'id' => $this->clientsProject->client->id,
                    'name' => $this->clientsProject->client->name,
                    'company_type' => $this->clientsProject->client->clientCompanyType?->name,
                    'company_name' => $this->clientsProject->client->company_name,
                    'company_address' => $this->clientsProject->client->company_address,
                ] : null,

                'project' => $this->clientsProject->project ? [
                    'id' => $this->clientsProject->project->id,
                    'title' => $this->clientsProject->project->title,
                    'start_date' => $this->clientsProject->project->start_date,
                    'end_date' => $this->clientsProject->project->end_date,
                ] : null,

                'subscription' => $this->clientsProject->subscription ? [
                    'id' => $this->clientsProject->subscription->id,
                    'title' => $this->clientsProject->subscription->title,
                    'type' => $this->clientsProject->subscription->type,
                    'start_coverage' => $this->clientsProject->subscription->start_coverage,
                    'end_coverage' => $this->clientsProject->subscription->end_coverage,
                ] : null,

                'payment' => $this->clientsProject && $this->clientsProject->payments->first()
                    ? [
                        'id' => $this->clientsProject->payments->first()->id,
                        'payment_type' => $this->clientsProject->payments->first()->payment_type,
                        'recurring_type' => $this->clientsProject->payments->first()->recurring_type,
                        'number_of_cycles' => $this->clientsProject->payments->first()->number_of_cycles,
                    ]
                    : null,
            ] : null,

            'transaction' => $this->transaction ? [
                'id'          => $this->transaction->id,
                'net_amount' => $this->transaction->net_amount,
                'gross_amount' => $this->gross_amount,
                'vat_amount' => $this->vat_amount,
                'wh_tax'      => $this->transaction->wh_tax,
                'paid_at'     => $this->transaction->paid_at,
                'officialReceipt' => $this->transaction->officialReceipt ? [
                    'id'                     => $this->transaction->officialReceipt->id,
                    'or_date'                => $this->transaction->officialReceipt->or_date,
                    'service_invoice_number' => $this->transaction->officialReceipt->service_invoice_number,
                    'payment_acknowledgement_number' => $this->transaction->officialReceipt->payment_acknowledgement_number,
                    'billing_statement_number' => $this->transaction->officialReceipt->billing_statement_number,
                    'base_amount'                 => $this->transaction->officialReceipt->base_amount,
                    'vat_amount'             => $this->transaction->officialReceipt->vat_amount,
                    'wh_tax'                 => $this->transaction->officialReceipt->wh_tax,
                    'other'                  => $this->transaction->officialReceipt->other,
                    'other_label'            => $this->transaction->officialReceipt->other_label,
                    'total_amount'           => $this->transaction->officialReceipt->total_amount,
                    'notes'                  => $this->transaction->officialReceipt->notes,

                    'form2307' => $this->transaction->officialReceipt->form2307 ? [
                        'id'            => $this->transaction->officialReceipt->form2307->id,
                        'period_from'   => $this->transaction->officialReceipt->form2307->period_from?->format('Y-m-d'),
                        'period_to'     => $this->transaction->officialReceipt->form2307->period_to?->format('Y-m-d'),
                        'payee_tin'     => $this->transaction->officialReceipt->form2307->payee_tin,
                        'atc_code'      => $this->transaction->officialReceipt->form2307->atc_code,
                        'month1_amount' => $this->transaction->officialReceipt->form2307->month1_amount,
                        'month2_amount' => $this->transaction->officialReceipt->form2307->month2_amount,
                        'month3_amount' => $this->transaction->officialReceipt->form2307->month3_amount,
                        'total_income'  => $this->transaction->officialReceipt->form2307->total_income,
                        'tax_withheld'  => $this->transaction->officialReceipt->form2307->tax_withheld,
                    ] : null,
                ] : null,
            ] : null,
        ];
    }
}
