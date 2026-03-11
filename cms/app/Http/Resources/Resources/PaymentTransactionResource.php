<?php

namespace App\Http\Resources\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PaymentTransactionResource extends JsonResource
{
    public static $wrap = false;
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id'=> $this->id,
            'amount_paid'=> $this->amount_paid,
            'paid_at'=> $this->paid_at->format('Y-m-d'),
            'client'     => [
                'name' => $this->paymentSchedule?->payment?->clientsProject?->client?->name,
            ],
            'project'    => [
                'title' => $this->paymentSchedule?->payment?->clientsProject?->project?->title,
            ],
            'official_receipt' => $this->officialReceipt ? [
                'or_number'        => $this->officialReceipt->or_number,
                'form_2307_status' => $this->officialReceipt->form_2307_status,
            ] : null,
        ];
    }
}
