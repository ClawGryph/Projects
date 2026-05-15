<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CompanyPaymentDetail extends Model
{
    protected $fillable = [
        'tin_no',
        'tin_name',
        'bank_name',
        'account_name',
        'account_number',
    ];
}
