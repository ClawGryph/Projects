<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ManualInvoice extends Model
{
    protected $fillable = [
        'payment_schedule_id',
        'line_items',
    ];

    protected $casts = [
        'line_items' => 'array',
    ];

    public function paymentSchedule()
    {
        return $this->belongsTo(PaymentSchedule::class);
    }
}
