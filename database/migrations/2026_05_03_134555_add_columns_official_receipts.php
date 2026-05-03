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
            $table->renameColumn('amount', 'base_amount');
            $table->decimal('wh_tax', 10,2)->default(0)->after('vat_amount');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('official_receipts', function (Blueprint $table) {
            $table->renameColumn('base_amount', 'amount');
            $table->dropColumn('wh_tax');
        });
    }
};
