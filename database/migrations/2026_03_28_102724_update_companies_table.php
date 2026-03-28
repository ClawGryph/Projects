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
        Schema::table('companies', function (Blueprint $table) {
            $table->dropColumn(["wtax_rate", "type", "vat_type"]);
            $table->string("business_type")->nullable();
            $table->decimal("annual_gross", 15, 2)->default(0.00);
            $table->enum("vat_type", ['vat_registered', 'non_vat'])->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('companies', function (Blueprint $table) {
            $table->dropColumn(["annual_gross", "business_type", "vat_type"]);
            $table->decimal('wtax_rate', 5, 2)->default(0.00);
            $table->enum('type', [
                'private_individual',
                'private_corp',
                'government'
            ]);
            $table->enum('vat_type', [
                'vat_exclusive',
                'vat_inclusive',
                'vat_exempt'
            ]);
        });
    }
};
