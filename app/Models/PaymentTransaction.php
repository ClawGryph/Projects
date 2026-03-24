<?php

namespace App\Models;

use App\Models\ClientsProject;
use Illuminate\Database\Eloquent\Model;

class PaymentTransaction extends Model
{
    protected $fillable = [
        'payment_schedule_id',
        'amount_paid',
        'paid_at'
    ];

    protected $casts = [
        'paid_at' => 'datetime'
    ];

    public function clientsProject()
    {
        return $this->belongsTo(ClientsProject::class);
    }

    public function paymentSchedule()
    {
        return $this->belongsTo(PaymentSchedule::class);
    }

    public function officialReceipt()
    {
        return $this->hasOne(OfficialReceipt::class, 'payment_transaction_id');
    }

    public function getClientAttribute()
    {
        return $this->paymentSchedule?->payment?->clientsProject?->client;
    }

    public function getProjectAttribute()
    {
        return $this->paymentSchedule?->payment?->clientsProject?->project;
    }
}
