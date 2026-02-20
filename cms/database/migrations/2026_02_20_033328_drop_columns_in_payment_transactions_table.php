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
        Schema::table('payment_transactions', function (Blueprint $table) {
            $table->dropForeign(["payment_id"]);
            $table->dropColumn("payment_id");
            $table->dropColumn("installment_number");
            $table->renameColumn("amount", "amount_paid");
            $table->foreignId("payment_schedule_id")->constrained()->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('payment_transactions', function (Blueprint $table) {
            $table->dropForeign(["payment_schedule_id"]);
            $table->dropColumn("payment_schedule_id");
            $table->renameColumn("amount_paid", "amount");
            $table->foreignId("payment_id")->constrained()->onDelete('cascade');
            $table->integer("installment_number")->nullable();
        });
    }
};
