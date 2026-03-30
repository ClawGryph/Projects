<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('clients_projects', function (Blueprint $table) {
            $table->enum('vat_type', ['vat_exclusive','vat_inclusive','vat_exempt'])
                ->default('vat_exempt');
        });

        DB::table('clients_projects')->update([
            'vat_type' => DB::raw("
                CASE
                    WHEN is_vatable = 1 THEN 'vat_exclusive'
                    ELSE 'vat_exempt'
                END
            ")
        ]);

        Schema::table('clients_projects', function (Blueprint $table) {
            $table->dropColumn('is_vatable');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('clients_projects', function (Blueprint $table) {
            $table->boolean('is_vatable')->default(false);
        });

        DB::table('clients_projects')->update([
            'is_vatable' => DB::raw("
                CASE
                    WHEN vat_type IN ('vat_exclusive','vat_inclusive') THEN 1
                    ELSE 0
                END
            ")
        ]);

        Schema::table('clients_projects', function (Blueprint $table) {
            $table->dropColumn('vat_type');
        });
    }
};
