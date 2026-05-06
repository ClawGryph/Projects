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

        return [
            'company_id' => $this->company_id,
            'id'          => $this->id,
            'net_amount' => $this->net_amount,
            'gross_amount' => $this->gross_amount,
            'vat_amount' => $this->vat_amount,
            'wh_tax'      => $this->wh_tax,
            'paid_at'     => $this->paid_at->format('Y-m-d'),

            'client' => $clientsProject?->client
                ? new ClientResource($clientsProject->client)
                : null,

            'project' => $clientsProject?->project
                ? new ProjectResource($clientsProject->project)
                : null,

            'subscription' => $clientsProject?->subscription
                ? new SubscriptionResource($clientsProject->subscription)
                : null,

            'payment' => $this->paymentSchedule?->payment
                ? new PaymentResource($this->paymentSchedule->payment)
                : null,

            'official_receipt' => $this->officialReceipt
                ? new OfficialReceiptResource($this->officialReceipt)
                : null,
        ];
    }
}
