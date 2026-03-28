<?php

namespace App\Http\Resources\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PaymentResource extends JsonResource
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
            'company_id' => $this->company_id,
            'id'=> $this->id,
            'payment_type'=> $this->payment_type,
            'recurring_type'=> $this->recurring_type,
            'installments' => $this->installments,
            'current_installment' => $this->current_installment,
            'start_date' => $this->start_date
                            ? $this->start_date->format('Y-m-d')
                            : null,
            'next_payment_date' => $this->next_payment_date
                            ? $this->next_payment_date->format('Y-m-d')
                            : null,
            'status' => $this->status
        ];
    }
}
