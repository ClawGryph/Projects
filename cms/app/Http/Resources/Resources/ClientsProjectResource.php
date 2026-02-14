<?php

namespace App\Http\Resources\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Carbon;

class ClientsProjectResource extends JsonResource
{
    public static $wrap = false;
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $payment = $this->payments->first();

        return [
            'id' => $this->id,
            'created_at' => $this->created_at,

            'project' => [
                'id' => $this->project->id,
                'title' => $this->project->title,
                'description' => $this->project->description,
                'price' => $this->project->price,
                'status' => $this->project->status,
                'start_date' => $this->project->start_date
                                ? Carbon::parse($this->project->start_date)->format('Y-m-d')
                                : null,
                'end_date' => $this->project->end_date
                                ? Carbon::parse($this->project->end_date)->format('Y-m-d')
                                : null,
                'created_at' => $this->project->created_at,
            ],

            
            'payment' => $payment ? [
                'id' => $payment->id, 
                'payment_type' => $payment->payment_type,
                'recurring_type' => $payment->recurring_type,
                'installments' => $payment->installments,
                'current_installment' => $payment->current_installment,
                'start_date' => $payment->start_date ? Carbon::parse($payment->start_date)->format('Y-m-d')
                                : null,
                'next_payment_date' => $payment->next_payment_date ? Carbon::parse($payment->next_payment_date)->format('Y-m-d')
                                : null,
                'status' => $payment->status,
            ] : null,

            'client' => [
                'id' => $this->client->id,
                'name' => $this->client->name,
            ],
        ];
    }
}
