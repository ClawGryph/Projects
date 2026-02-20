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
        'number_of_cycles',
        'fixed_rate',
        'start_date',
    ];

    protected $casts = [
        'start_date' => 'datetime',
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
