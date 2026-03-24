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
            $table->dropColumn('or_number');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('official_receipts', function (Blueprint $table) {
            $table->string('or_number')->nullable()->unique();
        });
    }
};
