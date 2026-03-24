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
        Schema::create('official_receipts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('payment_transaction_id')->constrained()->onDelete('cascade');
            $table->string('or_number')->unique();
            $table->date('or_date');
            $table->string('service_invoice_number');
            $table->decimal('amount', 10, 2);
            $table->decimal('vat_amount', 10, 2)->nullable();
            $table->string('other')->nullable();
            $table->decimal('total_amount', 10, 2);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('official_receipts');
    }
};
