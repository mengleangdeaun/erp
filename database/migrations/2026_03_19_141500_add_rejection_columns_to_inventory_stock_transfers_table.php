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
        Schema::table('inventory_stock_transfers', function (Blueprint $table) {
            $table->foreignId('rejected_by_id')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamp('rejected_at')->nullable();
            $table->text('rejected_reason')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('inventory_stock_transfers', function (Blueprint $table) {
            $table->dropForeign(['rejected_by_id']);
            $table->dropColumn(['rejected_by_id', 'rejected_at', 'rejected_reason']);
        });
    }
};
