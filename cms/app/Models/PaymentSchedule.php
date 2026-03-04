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

    public function payment()
    {
        return $this->belongsTo(Payment::class);
    }

    public function paymentTransactions()
    {
        return $this->hasMany(PaymentTransaction::class, 'payment_schedule_id');
    }

    public function clientsProject()
    {
        return $this->hasOneThrough(
            ClientsProject::class,
            Payment::class,
            'id',                  // Foreign key on Payment? (payment_id? check below)
            'id',                  // Foreign key on ClientsProject table (id)
            'payment_id',          // Local key on PaymentSchedule (payment_id)
            'clients_project_id'   // Local key on Payment (clients_project_id)
        );
    }
}
