<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class OfficialReceipt extends Model
{
    protected $fillable = [
        'payment_transaction_id',
        'or_number',
        'or_date',
        'service_invoice_number',
        'amount',
        'vat_amount',
        'other',
        'total_amount',
        'form_2307_status',
    ];

    public function form2307()
    {
        return $this->hasOne(Form2307::class);
    }
}
