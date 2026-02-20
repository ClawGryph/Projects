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
            $table->integer('fixed_rate')->nullable();
            $table->renameColumn('installments', 'number_of_cycles');
            $table->dropColumn('next_payment_date');
            $table->dropColumn('current_installment');
            $table->dropColumn('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            $table->dropColumn('fixed_rate');
            $table->renameColumn('number_of_cycles', 'installments');
            $table->date('next_payment_date')->nullable();
            $table->integer('current_installment')->nullable();
            $table->enum('status', ['pending', 'paid', 'overdue', 'partial', 'cancelled', 'failed'])->default('pending');
        });
    }
};
