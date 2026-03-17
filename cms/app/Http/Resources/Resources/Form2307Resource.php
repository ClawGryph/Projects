<?php

namespace App\Http\Resources\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class Form2307Resource extends JsonResource
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
            'official_receipt_id'=> $this->official_receipt_id,
            'period_from'=> $this->period_from?->format('Y-m-d'),
            'period_to'=> $this->period_to?->format('Y-m-d'),
            'payee_tin'=> $this->payee_tin,
            'atc_code'=> $this->atc_code,
            'month1_amount'=> $this->month1_amount,
            'month2_amount'=> $this->month2_amount,
            'month3_amount'=> $this->month3_amount,
            'total_income'=> $this->total_income,
            'tax_withheld'=> $this->tax_withheld,
        ];
    }
}
