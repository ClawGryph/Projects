<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ClientsProject extends Model
{
    protected $table = 'clients_projects';

    protected $fillable = [
        'client_id',
        'project_id',
        'final_price',
        'is_vatable',
    ];

    public function client()
    {
        return $this->belongsTo(Client::class);
    }

    public function project()
    {
        return $this->belongsTo(Project::class);
    }

    public function payments()
    {
        return $this->hasMany(Payment::class);
    }
}
