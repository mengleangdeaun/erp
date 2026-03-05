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
        Schema::table('working_shifts', function (Blueprint $table) {
            $table->dropColumn(['start_time', 'end_time']);
            $table->json('working_days')->after('name')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('working_shifts', function (Blueprint $table) {
            $table->dropColumn('working_days');
            $table->time('start_time')->after('name');
            $table->time('end_time')->after('start_time');
        });
    }
};
