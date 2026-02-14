<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Project extends Model
{
    /** @use HasFactory<\Database\Factories\ProjectFactory> */
    use HasFactory;

    protected $fillable = [
        'title',
        'description',
        'start_date',
        'end_date',
        'price',
        'status',
        'created_at'
    ];

    protected $casts = [
        'start_date' => 'datetime',
        'end_date' => 'datetime',
    ];

    public function clients()
    {
        return $this->belongsToMany(User::class, 'clients_projects', 'project_id', 'client_id')
                    ->withTimestamps();
    }

    public function clientsProjects()
    {
        return $this->hasMany(ClientsProject::class);
    }

}
