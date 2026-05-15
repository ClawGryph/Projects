<?php

namespace App\Http\Resources\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CompanyPaymentDetailResource extends JsonResource
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
            'tin_no'=> $this->tin_no,
            'tin_name'=> $this->tin_name,
            'bank_name'=> $this->bank_name,
            'account_name'=> $this->account_name,
            'account_number'=> $this->account_number,
        ];
    }
}
