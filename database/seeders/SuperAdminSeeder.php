<?php

namespace Database\Seeders;

use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class SuperAdminSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
       $role = Role::firstOrCreate(
            ['name' => 'super_admin'],
            ['label' => 'Super Admin']
        );

        $user = User::firstOrCreate(
            ['email' => 'sadmin@sadmin.com'],
            [
                'name' => 'Super Admin',
                'password' => Hash::make('password'),
            ]
        );

        $user->roles()->syncWithoutDetaching([$role->id]);
    }
}
