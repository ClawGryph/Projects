<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SubscriptionLog extends Model
{
    protected $fillable = [
        'subscription_id',
        'user_id',
        'field',
        'old_value',
        'new_value',
        'cr_no',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
