<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ServiceTypeSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $types = [
            [
                'type' => 'IT Services',
                'rate' =>  1
            ],
            [
                'type' => 'Software Development',
                'rate' =>  1
            ],
            [
                'type' => 'Web Development',
                'rate' =>  1
            ],
            [
                'type' => 'Mobile App Development',
                'rate' =>  1
            ],
            [
                'type' => 'Consulting',
                'rate' =>  1
            ],
            [
                'type' => 'Government Services',
                'rate' =>  5
            ],
        ];

        foreach ($types as $type){
            DB::table('service_types')->updateOrInsert(
                [
                'type' => $type['type'],
                'rate' => $type['rate'],
            ],
            $type
            );
        }
    }
}
