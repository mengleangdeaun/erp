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
            $table->foreignId('payment_account_id')->nullable()->after('payment_status')->constrained('payment_accounts')->onDelete('set null');
            $table->string('receipt_path')->nullable()->after('payment_account_id');
        });

        Schema::table('sales_order_items', function (Blueprint $table) {
            $table->foreignId('job_part_id')->nullable()->after('itemable_id')->constrained('job_parts_master')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('sales_orders', function (Blueprint $table) {
            $table->dropForeign(['payment_account_id']);
            $table->dropColumn(['payment_account_id', 'receipt_path']);
        });

        Schema::table('sales_order_items', function (Blueprint $table) {
            $table->dropForeign(['job_part_id']);
            $table->dropColumn(['job_part_id']);
        });
    }
};
