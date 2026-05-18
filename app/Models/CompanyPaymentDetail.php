<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CompanyPaymentDetail extends Model
{
    protected $fillable = [
        'type',
        'bank_name',
        'account_name',
        'account_number',
    ];
}
