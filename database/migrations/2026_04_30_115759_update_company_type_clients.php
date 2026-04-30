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
        Schema::table('clients', function (Blueprint $table) {
           $table->dropColumn('company_type');
           $table->foreignId('company_type_id')->nullable()->constrained('company_types')->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('clients', function (Blueprint $table) {
             $table->dropForeign(['company_type_id']);
            $table->dropColumn('company_type_id');
            $table->enum("company_type", ['Private Individual', 'Private Corp', 'Government'])->nullable();
        });
    }
};
