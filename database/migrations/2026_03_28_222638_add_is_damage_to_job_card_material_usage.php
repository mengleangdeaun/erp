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
        Schema::table('job_card_material_usage', function (Blueprint $table) {
            $table->boolean('is_damage')->default(false)->after('job_card_item_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('job_card_material_usage', function (Blueprint $table) {
            $table->dropColumn('is_damage');
        });
    }
};
