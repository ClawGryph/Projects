<?php

namespace App\Http\Resources\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MismatchReportResource extends JsonResource
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
            'payment_schedule_id'=> $this->payment_schedule_id,
            'transaction_id'=> $this->transaction_id,
            'official_receipt_id'=> $this->official_receipt_id,
            'total_paid'=> $this->total_paid,
            'total_si'=> $this->total_si,
            'is_checked'=> $this->is_checked,
            'notes'=> $this->notes,
        ];
    }
}
