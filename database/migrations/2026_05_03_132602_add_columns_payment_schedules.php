<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('payment_schedules', function (Blueprint $table) {
            $table->renameColumn('expected_amount', 'total_amount');
            $table->decimal('base_amount', 10,2)->default(0)->after('payment_rate');
            $table->decimal('vat_amount', 10,2)->default(0)->after('base_amount');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('payment_schedules', function (Blueprint $table) {
            $table->renameColumn('total_amount', 'expected_amount');
            $table->dropColumn(['base_amount', 'vat_amount']);
        });
    }
};
