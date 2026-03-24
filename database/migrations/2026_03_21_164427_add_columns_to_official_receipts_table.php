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
            $table->string('payment_acknowledgement_number')->nullable()->after('service_invoice_number');
            $table->string('billing_statement_number')->nullable()->after('or_date');
            $table->string('other_label')->nullable()->after('other');
            $table->text('notes')->nullable()->after('total_amount');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('official_receipts', function (Blueprint $table) {
            $table->dropColumn(['payment_acknowledgement_number', 'billing_statement_number', 'other_label', 'notes']);
        });
    }
};
