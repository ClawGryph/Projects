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
        Schema::table('payments', function (Blueprint $table) {
            $table->dropColumn(['payment_type', 'recurring_type', 'start_date']);
            $table->decimal('total_cost', 10,2)->default(0);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            $table->dropColumn('total_cost');
            $table->enum('payment_type', ['one_time', 'installment', 'recurring']);
            $table->enum('recurring_type', ['weekly', 'monthly', 'yearly']);
            $table->date('start_date');
        });
    }
};
