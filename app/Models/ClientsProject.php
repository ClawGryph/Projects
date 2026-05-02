<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ClientsProject extends Model
{
    protected $table = 'clients_projects';

    protected $fillable = [
        'client_id',
        'project_id',
        'subscription_id',
        'final_price',
        'vat_type',
    ];

    public function client()
    {
        return $this->belongsTo(Client::class);
    }

    public function project()
    {
        return $this->belongsTo(Project::class);
    }

    public function subscription()
    {
        return $this->belongsTo(Subscription::class);
    }

    public function payments()
    {
        return $this->hasMany(Payment::class);
    }
}
