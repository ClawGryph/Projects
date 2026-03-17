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
        Schema::create('form_2307', function (Blueprint $table) {
            $table->id();
            $table->foreignId('official_receipt_id')->constrained()->onDelete('cascade');
            $table->date('period_from');
            $table->date('period_to');
            $table->string('payee_tin');
            $table->string('atc_code');
            $table->decimal('month1_amount', 10, 2);
            $table->decimal('month2_amount', 10, 2);
            $table->decimal('month3_amount', 10, 2);
            $table->decimal('total_income', 10, 2);
            $table->decimal('tax_withheld', 10, 2);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('form_2307');
    }
};
