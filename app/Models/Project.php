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
        'adjusted_start_date',
        'adjusted_end_date',
        'cr_no',
        'price',
        'status',
        'created_at'
    ];

    protected $casts = [
        'start_date' => 'datetime',
        'end_date' => 'datetime',
        'adjusted_start_date' => 'date',
        'adjusted_end_date'   => 'date',
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

    public function logs()
    {
        return $this->hasMany(ProjectLog::class);
    }

    public function getAutoStatusAttribute(): string
    {
        if (in_array($this->status, ['complete', 'hold'])) {
            return $this->status;
        }

        $today = now()->startOfDay();
        $start = $this->adjusted_start_date ?? $this->start_date;
        $end = $this->adjusted_end_date ?? $this->end_date;

        if ($start && $today->lt($start)) return 'pending';
        if ($end && $today->gt($end)) return 'delay';
        if ($start && $today->gte($start)) return 'ongoing';

        return $this->status ?? 'pending';
    }
}
