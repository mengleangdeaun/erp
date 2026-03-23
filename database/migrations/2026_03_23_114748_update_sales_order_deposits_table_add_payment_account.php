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
        Schema::table('sales_order_deposits', function (Blueprint $table) {
            $table->foreignId('payment_account_id')->nullable()->after('amount')->constrained('payment_accounts')->onDelete('set null');
            $table->string('receipt_path')->nullable()->after('payment_account_id');
            $table->dropColumn('payment_method');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('sales_order_deposits', function (Blueprint $table) {
            $table->dropForeign(['payment_account_id']);
            $table->dropColumn(['payment_account_id', 'receipt_path']);
            $table->string('payment_method')->nullable();
        });
    }
};
