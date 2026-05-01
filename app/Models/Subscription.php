<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Subscription extends Model
{
    protected $fillable = [
        'company_id',
        'subscription_id',
        'title',
        'description',
        'start_coverage',
        'end_coverage',
        'adjusted_start_coverage',
        'adjusted_end_coverage',
        'cr_no',
        'cost',
        'type',
        'status',
        'created_at'
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
        'adjusted_start_date' => 'date',
        'adjusted_end_date'   => 'date',
    ];
}
