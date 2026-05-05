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
            $table->enum('vat_type', ['vat_exclusive','vat_inclusive','vat_exempt', 'vat_other'])->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('clients_projects', function (Blueprint $table) {
            $table->enum('vat_type', ['vat_exclusive','vat_inclusive','vat_exempt'])->change();
        });
    }
};
