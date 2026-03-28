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
            $table->foreignId('company_id')->nullable(false)->change();
        });
        Schema::table('projects', function (Blueprint $table) {
            $table->foreignId('company_id')->nullable(false)->change();
        });
        Schema::table('payments', function (Blueprint $table) {
            $table->foreignId('company_id')->nullable(false)->change();
        });
        Schema::table('payment_transactions', function (Blueprint $table) {
            $table->foreignId('company_id')->nullable(false)->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('clients', function (Blueprint $table) {
            $table->foreignId('company_id')->nullable()->change();
        });
        Schema::table('projects', function (Blueprint $table) {
            $table->foreignId('company_id')->nullable()->change();
        });
        Schema::table('payments', function (Blueprint $table) {
            $table->foreignId('company_id')->nullable()->change();
        });
        Schema::table('payment_transactions', function (Blueprint $table) {
            $table->foreignId('company_id')->nullable()->change();
        });
    }
};
