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
            'id'                 => $this->id,
            'payment_id'         => $this->payment_id,
            'schedule_index'     => $this->schedule_index,
            'total_schedules'    => $this->total_schedules,
            'due_date'           => $this->due_date?->format('Y-m-d'),
            'payment_rate'       => $this->payment_rate,
            'base_amount'        => $this->base_amount,
            'total_amount'       => $this->total_amount,
            'vat_amount'         => $this->vat_amount,
            'status'             => $this->status,
            'invoice_number'     => $this->invoice_number,
            'is_or_issued'       => $this->is_or_issued,
            'is_form2307_issued' => $this->is_form2307_issued,

            'clientsProject' => $clientsProject
                ? new ClientsProjectResource($clientsProject)
                : null,

            'transaction' => $this->transaction
                ? new PaymentTransactionResource($this->transaction)
                : null,
        ];
    }
}
