<?php

namespace App\Http\Resources\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProjectResource extends JsonResource
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
            'title'=> $this->title,
            'description' => $this->description,
            'start_date'=> $this->start_date ? date('Y-m-d', strtotime($this->start_date)) : null,
            'end_date' => $this->end_date ? date('Y-m-d', strtotime($this->end_date)) : null,
            'adjusted_end_date' => $this->adjusted_end_date ? date('Y-m-d', strtotime($this->adjusted_end_date)) : null,
            'adjusted_start_date' => $this->adjusted_start_date ? date('Y-m-d', strtotime($this->adjusted_start_date)) : null,
            'cr_no' => $this->cr_no,
            'price' => $this->price,
            'status' => $this->status,
            'isEnded' => $this->end_date && $this->end_date <= now(),
            'created_at' => $this->created_at,
            'auto_status' => $this->auto_status,
        ];
    }
}
