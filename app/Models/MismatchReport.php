<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MismatchReport extends Model
{
    protected $fillable = [
        'payment_schedule_id',
        'transaction_id',
        'official_receipt_id',
        'total_paid',
        'total_si',
        'is_checked',
        'notes'
    ];

    protected $casts = [
        'is_checked' => 'boolean',
        'total_paid'  => 'float',
        'total_si'    => 'float',
    ];

    public function paymentSchedule()
    {
        return $this->belongsTo(PaymentSchedule::class);
    }

    public function transaction()
    {
        return $this->belongsTo(PaymentTransaction::class);
    }

    public function officialReceipt()
    {
        return $this->belongsTo(OfficialReceipt::class);
    }
}
