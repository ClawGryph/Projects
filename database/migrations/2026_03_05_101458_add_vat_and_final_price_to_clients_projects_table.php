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
            $table->decimal('final_price', 10, 2)->default(0);
            $table->boolean('is_vatable')->default(true);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('clients_projects', function (Blueprint $table) {
            $table->dropColumn(['final_price', 'is_vatable']);
        });
    }
};
