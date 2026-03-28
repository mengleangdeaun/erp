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
        Schema::table('job_card_replacement_types', function (Blueprint $table) {
            $table->dropColumn('status');
            $table->boolean('is_active')->default(true);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('job_card_replacement_types', function (Blueprint $table) {
            $table->string('status')->default('active');
            $table->dropColumn('is_active');
        });
    }
};
