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
        Schema::table('job_cards', function (Blueprint $table) {
            $table->string('status')->default('Pending')->change();
        });

        Schema::table('job_card_items', function (Blueprint $table) {
            $table->string('status')->default('Pending')->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('job_cards', function (Blueprint $table) {
            $table->enum('status', ['PENDING', 'IN_PROGRESS', 'QC', 'COMPLETED', 'CANCELLED'])->default('PENDING')->change();
        });

        Schema::table('job_card_items', function (Blueprint $table) {
            $table->enum('status', ['PENDING', 'IN_PROGRESS', 'COMPLETED'])->default('PENDING')->change();
        });
    }
};
