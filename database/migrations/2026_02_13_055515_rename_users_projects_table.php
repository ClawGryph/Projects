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
        Schema::table('users_projects', function (Blueprint $table) {
            Schema::rename('users_projects', 'clients_projects');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users_projects', function (Blueprint $table) {
            Schema::rename('clients_projects', 'users_projects');
        });
    }
};
