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
        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->timestamps();
            $table->enum('payment_type', ['one_time', 'recurring', 'installment'])->default('one_time');
            $table->enum('recurring_type', ['weekly', 'monthly', 'yearly'])->nullable();
            $table->integer('installments')->nullable();
            $table->integer('current_installment')->nullable();
            $table->date('start_date');
            $table->date('next_payment_date')->nullable();
            $table->enum('status', ['pending', 'paid', 'overdue', 'partial', 'cancelled', 'failed'])->default('pending');
            $table->foreignId('clients_project_id')->constrained()->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};
