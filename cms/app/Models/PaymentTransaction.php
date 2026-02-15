<?php

namespace App\Models;

use App\Models\ClientsProject;
use Illuminate\Database\Eloquent\Model;

class PaymentTransaction extends Model
{
    protected $fillable = [
        'payment_id',
        'amount',
        'paid_at',
        'installment_number'
    ];

    protected $casts = [
        'paid_at' => 'datetime'
    ];

    public function clientsProject()
    {
        return $this->belongsTo(ClientsProject::class);
    }
}
