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
            'clients_project_id' => $this->clients_project_id,
            'number_of_cycles' => $this->number_of_cycles,
            'fixed_rate' => $this->fixed_rate,
            'total_cost' => $this->total_cost,
        ];
    }
}
