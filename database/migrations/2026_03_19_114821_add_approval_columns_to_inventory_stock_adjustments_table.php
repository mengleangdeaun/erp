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
        Schema::table('inventory_stock_adjustments', function (Blueprint $table) {
            $table->string('status')->default('DRAFT')->change(); // Change enum to string for flexibility
            $table->foreignId('approved_by_id')->nullable()->constrained('users');
            $table->timestamp('approved_at')->nullable();
            $table->foreignId('rejected_by_id')->nullable()->constrained('users');
            $table->timestamp('rejected_at')->nullable();
            $table->text('rejected_reason')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('inventory_stock_adjustments', function (Blueprint $table) {
            $table->dropForeign(['approved_by_id']);
            $table->dropForeign(['rejected_by_id']);
            $table->dropColumn(['approved_by_id', 'approved_at', 'rejected_by_id', 'rejected_at', 'rejected_reason']);
        });
    }
};
