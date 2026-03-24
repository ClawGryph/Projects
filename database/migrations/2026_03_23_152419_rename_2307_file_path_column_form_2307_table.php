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
        Schema::table('form_2307', function (Blueprint $table) {
            $table->renameColumn('2307_file_path', 'form_file_path');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('form_2307', function (Blueprint $table) {
            $table->renameColumn('form_file_path', '2307_file_path');
        });
    }
};
