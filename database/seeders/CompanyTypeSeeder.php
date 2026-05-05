<?php

namespace Database\Seeders;

use App\Models\CompanyType;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class CompanyTypeSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $types = [
            ['name' => 'Private Corporation'],
            ['name' => 'Government'],
            ['name' => 'Private Individual'],
            ['name' => 'Pieza'],
        ];

        foreach ($types as $type) {
            CompanyType::firstOrCreate(['name' => $type['name']]);
        }
    }
}
