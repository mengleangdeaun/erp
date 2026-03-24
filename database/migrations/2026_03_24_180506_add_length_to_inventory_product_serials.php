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
        Schema::table('inventory_product_serials', function (Blueprint $table) {
            $table->decimal('length', 10, 2)->after('width')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('inventory_product_serials', function (Blueprint $table) {
            $table->dropColumn('length');
        });
    }
};
