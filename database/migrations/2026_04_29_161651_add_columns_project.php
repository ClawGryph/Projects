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
        Schema::table('projects', function (Blueprint $table) {
            $table->date('adjusted_start_date')->nullable()->after('end_date');
            $table->date('adjusted_end_date')->nullable()->after('adjusted_start_date');
            $table->string('cr_no')->nullable()->after('adjusted_end_date');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('projects', function (Blueprint $table) {
            $table->dropColumn(['adjusted_start_date', 'adjusted_end_date', 'cr_no']);
        });
    }
};
