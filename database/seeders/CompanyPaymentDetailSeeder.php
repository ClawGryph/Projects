<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class CompanyPaymentDetailSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $entries = [
            [
                'type'           => 'tin',
                'bank_name'      => null,
                'account_name'   => 'Chimes Consulting OPC',
                'account_number' => '744328715000',
            ],
            [
                'type'           => 'bank',
                'bank_name'      => 'Union Bank of the Philippines',
                'account_name'   => 'Chimes Consulting OPC',
                'account_number' => '002080011681',
            ],
        ];
        
        foreach ($entries as $entry) {
            DB::table('company_payment_details')->updateOrInsert(
                [
                    'type'           => $entry['type'],
                    'account_number' => $entry['account_number'],
                ],
                $entry
            );
        }
    }
}
