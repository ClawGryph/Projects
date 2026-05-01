<?php

namespace App\Http\Resources\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SubscriptionResource extends JsonResource
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
            'id' => $this->id,
            'company_id' => $this->company_id,
            'subscription_id'=> $this->subscription_id,
            'title'=> $this->title,
            'description' => $this->description,
            'start_coverage'=> $this->start_coverage ? date('Y-m-d', strtotime($this->start_coverage)) : null,
            'end_coverage' => $this->end_coverage ? date('Y-m-d', strtotime($this->end_coverage)) : null,
            'adjusted_end_coverage' => $this->adjusted_end_coverage ? date('Y-m-d', strtotime($this->adjusted_end_coverage)) : null,
            'adjusted_start_coverage' => $this->adjusted_start_coverage ? date('Y-m-d', strtotime($this->adjusted_start_coverage)) : null,
            'cr_no' => $this->cr_no,
            'cost' => $this->cost,
            'status' => $this->status,
            'type' => $this->type,
            'isEnded' => $this->end_date && $this->end_date <= now(),
            'created_at' => $this->created_at
        ];
    }
}
