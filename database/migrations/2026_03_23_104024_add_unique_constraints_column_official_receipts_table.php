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
        Schema::table('official_receipts', function (Blueprint $table) {
            $table->string('service_invoice_number')->nullable()->unique()->change();
            $table->string('payment_acknowledgement_number')->nullable()->unique()->change();
            $table->string('billing_statement_number')->nullable()->unique()->change();
            $table->decimal('other', 10, 2)->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('official_receipts', function (Blueprint $table) {
            $table->string('service_invoice_number')->nullable(false)->unique(false)->change();
            $table->string('payment_acknowledgement_number')->nullable(false)->unique(false)->change();
            $table->string('billing_statement_number')->nullable(false)->unique(false)->change();
            $table->string('other')->nullable(false)->change();
        });
    }
};
