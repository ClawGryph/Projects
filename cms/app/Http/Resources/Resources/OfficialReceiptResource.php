<?php

namespace App\Http\Resources\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OfficialReceiptResource extends JsonResource
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
            'id'                     => $this->id,
            'payment_transaction_id' => $this->payment_transaction_id,
            'or_number'              => $this->or_number,
            'or_date'                => $this->or_date,
            'service_invoice_number' => $this->service_invoice_number,
            'amount'                 => $this->amount,
            'vat_amount'             => $this->vat_amount,
            'other'                  => $this->other,
            'total_amount'           => $this->total_amount,
            'form_2307_status'       => $this->form_2307_status,
            'created_at'             => $this->created_at,
            'updated_at'             => $this->updated_at,
            'form2307'               => new Form2307Resource($this->whenLoaded('form2307')),
        ];
    }
}
