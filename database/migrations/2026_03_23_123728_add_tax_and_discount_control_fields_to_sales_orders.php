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
        Schema::table('sales_orders', function (Blueprint $table) {
            $table->decimal('taxable_amount', 15, 2)->default(0)->after('subtotal');
            $table->decimal('tax_percent', 5, 2)->default(0)->after('taxable_amount');
            $table->enum('discount_type', ['FIXED', 'PERCENT'])->default('FIXED')->after('discount_total');
            $table->decimal('discount_value', 15, 2)->default(0)->after('discount_type');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('sales_orders', function (Blueprint $table) {
            $table->dropColumn(['taxable_amount', 'tax_percent', 'discount_type', 'discount_value']);
        });
    }
};
