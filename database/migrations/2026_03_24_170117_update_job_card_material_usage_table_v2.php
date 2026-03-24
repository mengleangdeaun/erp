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
            if (!Schema::hasColumn('job_card_material_usage', 'serial_id')) {
                $table->foreignId('serial_id')->after('product_id')->nullable()->constrained('inventory_product_serials')->onDelete('set null');
            }
            $table->decimal('width_on_car', 10, 2)->nullable();
            $table->decimal('height_on_car', 10, 2)->nullable();
            $table->decimal('width_cut', 10, 2)->nullable();
            $table->decimal('height_cut', 10, 2)->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('job_card_material_usage', function (Blueprint $table) {
            $table->dropForeign(['serial_id']);
            $table->dropColumn(['serial_id', 'width_on_car', 'height_on_car', 'width_cut', 'height_cut']);
        });
    }
};
