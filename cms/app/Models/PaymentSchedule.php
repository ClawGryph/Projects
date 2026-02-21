<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PaymentSchedule extends Model
{
    protected $fillable = [
        'payment_id',
        'due_date',
        'payment_rate',
        'expected_amount',
        'status'
    ];

    protected $casts = [
        'due_date' => 'datetime'
    ];

    public function clientsProject()
    {
        return $this->belongsTo(ClientsProject::class);
    }

    public function paymentTransactions()
    {
        return $this->hasMany(PaymentTransaction::class);
    }
}
