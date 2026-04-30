<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Client extends Model
{
    protected $fillable = [
        'company_id',
        'name',
        'email',
        'phone_number',
        'company_name',
        'company_address',
        'company_type_id',
    ];

    public function projects()
    {
        return $this->belongsToMany(Project::class, 'clients_projects', 'client_id', 'project_id')
                    ->withTimestamps();
    }

    public function clientsProjects()
    {
        return $this->hasMany(ClientsProject::class);
    }

    public function clientCompanyType() {
        return $this->belongsTo(CompanyType::class, 'company_type_id');
    }
}
