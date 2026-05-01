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
        Schema::create('subscriptions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained()->cascadeOnDelete();
            $table->string('subscription_id')->unique();
            $table->string('title');
            $table->text('description')->nullable();
            $table->decimal('cost',10,2);
            $table->date('start_coverage');
            $table->date('end_coverage');
            $table->date('adjusted_start_coverage')->nullable();
            $table->date('adjusted_end_coverage')->nullable();
            $table->string('cr_no')->unique()->nullable();
            $table->enum('type', ['weekly', 'monthly', 'yearly']);
            $table->enum('status', ['ongoing', 'complete', 'pending', 'hold', 'delay'])->default('ongoing');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('subscriptions');
    }
};
