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
            $table->enum('shift_type', ['continuous', 'split'])->default('continuous')->after('name');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('working_shifts', function (Blueprint $table) {
            $table->dropColumn('shift_type');
        });
    }
};
