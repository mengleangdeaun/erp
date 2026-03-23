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
        Schema::disableForeignKeyConstraints();
        Schema::table('sales_orders', function (Blueprint $table) {
            if (Schema::hasColumn('sales_orders', 'payment_account_id')) {
                $table->dropColumn('payment_account_id');
            }
            if (Schema::hasColumn('sales_orders', 'receipt_path')) {
                $table->dropColumn('receipt_path');
            }
        });
        Schema::enableForeignKeyConstraints();
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('sales_orders', function (Blueprint $table) {
            $table->foreignId('payment_account_id')->nullable()->after('payment_status');
            $table->string('receipt_path')->nullable()->after('payment_account_id');
        });
    }
};
