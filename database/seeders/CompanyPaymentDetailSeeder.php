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
        DB::table('company_payment_details')->updateOrInsert(
            ['tin_no' => '744328715000'],
            [
                'tin_name' => 'Chimes Consulting OPC',
                'bank_name' => 'Union Bank of the Philippines',
                'account_name' => 'Chimes Consulting OPC',
                'account_number' => '002080011681',
            ]
        );
    }
}
