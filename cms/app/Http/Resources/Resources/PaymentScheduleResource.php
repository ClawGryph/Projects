<?php

namespace App\Http\Resources\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PaymentScheduleResource extends JsonResource
{
    public static $wrap = false;

    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'due_date' => $this->due_date ? $this->due_date->format('Y-m-d') : null,
            'payment_rate' => $this->payment_rate,
            'expected_amount' => $this->expected_amount,
            'status' => $this->status,

            'clientsProject' => $this->clientsProject ? [
                'id' => $this->clientsProject->id,

                'client' => $this->clientsProject->client ? [
                    'id' => $this->clientsProject->client->id,
                    'name' => $this->clientsProject->client->name,
                ] : null,

                'project' => $this->clientsProject->project ? [
                    'id' => $this->clientsProject->project->id,
                    'title' => $this->clientsProject->project->title,
                ] : null,

                'payment' => $this->clientsProject && $this->clientsProject->payments->first()
                    ? [
                        'id' => $this->clientsProject->payments->first()->id,
                        'payment_type' => $this->clientsProject->payments->first()->payment_type,
                        'recurring_type' => $this->clientsProject->payments->first()->recurring_type,
                    ]
                    : null,
            ] : null,
        ];
    }
}
