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
        Schema::table('branch_inventory_product', function (Blueprint $table) {
            $table->integer('reorder_level')->default(0)->after('inventory_product_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('branch_inventory_product', function (Blueprint $table) {
            $table->dropColumn('reorder_level');
        });
    }
};
