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
}
