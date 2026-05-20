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
        Schema::create('mismatch_reports', function (Blueprint $table) {
            $table->id();
            $table->foreignId('payment_schedule_id')->constrained()->cascadeOnDelete();
            $table->foreignId('transaction_id')->nullable()->constrained('payment_transactions')->cascadeOnDelete();
            $table->foreignId('official_receipt_id')->nullable()->constrained('official_receipts')->cascadeOnDelete();

            $table->decimal('total_paid', 15, 2)->default(0);
            $table->decimal('total_si', 15, 2)->default(0);

            $table->boolean('is_checked')->default(false);

            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('mismatch_reports');
    }
};
