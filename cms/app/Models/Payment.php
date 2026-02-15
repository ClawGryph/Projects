<?php

namespace App\Models;

use App\Models\ClientsProject;
use Illuminate\Database\Eloquent\Model;

class Payment extends Model
{
    protected $fillable = [
        'clients_project_id',
        'payment_type',
        'recurring_type',
        'installments',
        'current_installment',
        'start_date',
        'next_payment_date',
        'status'
    ];

    protected $attributes = [
        'current_installment' => 0,
    ];

    protected $casts = [
        'start_date' => 'datetime',
        'next_payment_date' => 'datetime',
    ];


    public function clientsProject()
    {
        return $this->belongsTo(ClientsProject::class);
    }

    public function getProjectAttribute()
    {
        return $this->clientsProject ? $this->clientsProject->project : null;
    }

    public function paymentTransactions()
    {
        return $this->hasMany(PaymentTransaction::class);
    }
}
