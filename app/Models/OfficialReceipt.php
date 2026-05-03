<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class OfficialReceipt extends Model
{
    protected $fillable = [
        'payment_transaction_id',
        'or_date',
        'service_invoice_number',
        'payment_acknowledgement_number',
        'billing_statement_number',
        'base_amount',
        'vat_amount',
        'wh_tax',
        'other',
        'other_label',
        'total_amount',
        'notes',
        'or_file_path',
    ];

    public function form2307()
    {
        return $this->hasOne(Form2307::class, 'official_receipt_id');
    }
}
