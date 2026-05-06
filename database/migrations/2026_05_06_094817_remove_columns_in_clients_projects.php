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
        Schema::table('clients_projects', function (Blueprint $table) {
            $table->dropColumn(['final_price', 'vat_type']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('clients_projects', function (Blueprint $table) {
            $table->decimal('final_price', 10,2);
            $table->enum('vat_type', ['vat_inclusive', 'vat_exclusive', 'vat_exempt', 'vat_other']);
        });
    }
};
