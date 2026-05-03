<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PaymentSchedule extends Model
{
    protected $fillable = [
        'payment_id',
        'due_date',
        'payment_rate',
        'base_amount',
        'total_amount',
        'vat_amount',
        'status',
        'invoice_number',
        'is_or_issued',
        'is_form2307_issued'
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

    public function transaction()
    {
        return $this->hasOne(PaymentTransaction::class, 'payment_schedule_id');
    }

    public function officialReceipt()
    {
        return $this->hasOneThrough(
            OfficialReceipt::class,
            PaymentTransaction::class,
            'payment_schedule_id', // FK on payment_transactions
            'payment_transaction_id', // FK on official_receipts
            'id',                  // Local key on payment_schedules
            'id'                   // Local key on payment_transactions
        );
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
