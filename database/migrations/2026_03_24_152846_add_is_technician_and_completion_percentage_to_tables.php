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
        Schema::table('employees', function (Blueprint $table) {
            $table->boolean('is_technician')->default(false)->after('status');
        });

        Schema::table('job_card_items', function (Blueprint $table) {
            $table->integer('completion_percentage')->default(0)->after('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('employees', function (Blueprint $table) {
            $table->dropColumn('is_technician');
        });

        Schema::table('job_card_items', function (Blueprint $table) {
            $table->dropColumn('completion_percentage');
        });
    }
};
