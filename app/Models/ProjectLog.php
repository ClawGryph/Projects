<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProjectLog extends Model
{
    protected $fillable = [
        'project_id',
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
