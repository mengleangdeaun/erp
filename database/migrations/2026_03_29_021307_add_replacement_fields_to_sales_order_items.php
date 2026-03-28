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
        Schema::table('sales_order_items', function (Blueprint $table) {
            $table->unsignedBigInteger('original_item_id')->nullable()->after('job_part_id');
            $table->unsignedBigInteger('replacement_type_id')->nullable()->after('original_item_id');
            
            $table->foreign('original_item_id')->references('id')->on('job_card_items')->onDelete('set null');
            $table->foreign('replacement_type_id')->references('id')->on('job_card_replacement_types')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('sales_order_items', function (Blueprint $table) {
            $table->dropForeign(['original_item_id']);
            $table->dropForeign(['replacement_type_id']);
            $table->dropColumn(['original_item_id', 'replacement_type_id']);
        });
    }
};
