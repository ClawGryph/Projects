<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Project extends Model
{
    /** @use HasFactory<\Database\Factories\ProjectFactory> */
    use HasFactory;

    protected $fillable = [
        'company_id',
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

    public function payments()
    {
        return $this->hasManyThrough(
            Payment::class,
            ClientsProject::class,
            'project_id',          // FK on clients_projects table
            'clients_project_id',  // FK on payments table
            'id',                  // Local key on projects table
            'id'                   // Local key on clients_projects table
        );
    }

}
