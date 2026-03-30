<?php

namespace App\Http\Resources\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ClientResource extends JsonResource
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
            'name'=> $this->name,
            'email'=> $this->email,
            'phone_number' => $this->phone_number,
            'company_name' => $this->company_name,
            'company_address' => $this->company_address,
            'company_type' => $this->company_type,
            'created_at'=> $this->created_at->format('Y-m-d H:i:s'),
        ];
    }
}
