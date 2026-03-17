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
        Schema::table('form_2307', function (Blueprint $table) {
            $table->decimal('month1_amount', 10, 2)->default(0)->change();
            $table->decimal('month2_amount', 10, 2)->default(0)->change();
            $table->decimal('month3_amount', 10, 2)->default(0)->change();
            $table->decimal('total_income', 10, 2)->default(0)->change();
            $table->decimal('tax_withheld', 10, 2)->default(0)->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('form_2307', function (Blueprint $table) {
            $table->decimal('month1_amount', 10, 2)->default(null)->change();
            $table->decimal('month2_amount', 10, 2)->default(null)->change();
            $table->decimal('month3_amount', 10, 2)->default(null)->change();
            $table->decimal('total_income', 10, 2)->default(null)->change();
            $table->decimal('tax_withheld', 10, 2)->default(null)->change();
        });
    }
};
