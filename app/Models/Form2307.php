<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Form2307 extends Model
{
    protected $table = 'form_2307';

    protected $fillable = [
        'official_receipt_id',
        'period_from',
        'period_to',
        'payee_tin',
        'atc_code',
        'month1_amount',
        'month2_amount',
        'month3_amount',
        'total_income',
        'tax_withheld',
        'form_file_path',
    ];

    protected $casts = [
        'period_from'    => 'date',
        'period_to'      => 'date',
    ];

    public function officialReceipt()
    {
        return $this->belongsTo(OfficialReceipt::class, 'official_receipt_id');
    }
}
