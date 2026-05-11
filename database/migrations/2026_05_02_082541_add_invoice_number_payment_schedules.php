<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Null out empty strings before adding unique constraint
        DB::statement("UPDATE payment_schedules SET invoice_number = NULL WHERE invoice_number = '' OR invoice_number IS NULL");

        Schema::table('payment_schedules', function (Blueprint $table) {
            $table->unique('invoice_number');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('payment_schedules', function (Blueprint $table) {
            $table->dropUnique(['invoice_number']);
        });
    }
};
