<?php

namespace App\Http\Resources\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PaymentScheduleResource extends JsonResource
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
            'due_date'=> $this->due_date
                        ? $this->due_date->format('Y-m-d')
                        : null,
            'payment_rate'=> $this->payment_rate,
            'expected_amount'=> $this->expected_amount,
            'status'=> $this->status
        ];
    }
}
