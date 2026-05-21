<?php

namespace App\Http\Resources\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PaymentScheduleResource extends JsonResource
{
    public static $wrap = false;

    public function toArray(Request $request): array
{
     $clientsProject = $this->payment?->clientsProject;
    $project        = $clientsProject?->project;
    $subscription   = $clientsProject?->subscription;
    $client         = $clientsProject?->client;
    $payment        = $clientsProject?->payments?->first();

    return [
        'id'                 => $this->id,
        'payment_id'         => $this->payment_id,
        'schedule_index'     => $this->schedule_index,
        'total_schedules'    => $this->total_schedules,
        'due_date'           => $this->due_date?->format('Y-m-d'),
        'payment_rate'       => $this->payment_rate,
        'base_amount'        => $this->base_amount,
        'total_amount'       => $this->total_amount,
        'vat_amount'         => $this->vat_amount,
        'status'             => $this->status,
        'invoice_number'     => $this->invoice_number,
        'is_invoice_generated' => $this->is_invoice_generated,
        'is_or_issued'       => $this->is_or_issued,
        'is_form2307_issued' => $this->is_form2307_issued,
        'start_coverage'     => $this->start_coverage?->format('Y-m-d'),
        'end_coverage'       => $this->end_coverage?->format('Y-m-d'),

        'transaction' => $this->whenLoaded('transaction',
            fn() => new PaymentTransactionResource($this->transaction)
        ),

        'clientsProject' => $clientsProject ? [
            'id'           => $clientsProject->id,
            'vat_type' => $project?->vat_type ?? $subscription?->vat_type ?? 'vat_exempt',
            'project'      => $project ? [
                'id'    => $project->id,
                'title' => $project->title,
                'payment_type'   => $project->payment_type,
                'vat_type' => $project->vat_type,
            ] : null,
            'subscription' => $subscription ? [
                'id'    => $subscription->id,
                'title' => $subscription->title,
                'frequency'   => $subscription->frequency,
                'vat_type' => $subscription->vat_type,
            ] : null,
            'client' => $client ? [
                'id'           => $client->id,
                'name'         => $client->name,
                'company_address' => $client->company_address,
                'company_type' => $client->clientCompanyType?->name ?? null,
            ] : null,
            'payment' => $payment ? [
                'id'             => $payment->id,
                'number_of_cycles' => $payment->number_of_cycles,
            ] : null,
        ] : null,

        'manualInvoice' => $this->whenLoaded('manualInvoice', function () {
            $items = $this->manualInvoice?->line_items ?? [];

            $additionalItems = collect($items)
                ->filter(fn($item) => !empty($item['is_additional']))
                ->values(); // re-index

            $total = $additionalItems->sum(fn($item) =>
                (float) ($item['amount'] ?? 0) + (float) ($item['vat_amount'] ?? 0)
            );

            $unitPriceTotal = $additionalItems->sum(fn($item) =>
                (float) ($item['amount'] ?? 0)
            );

            return [
                'total' => $total,
                'unitPriceTotal' => $unitPriceTotal,
                'items' => $additionalItems->map(fn($item) => [
                    'description'       => $item['description'] ?? null,
                    'unitPrice' => $item['unitPrice'] ?? null,
                ])->values(),
            ];
        }),
    ];
}
}
