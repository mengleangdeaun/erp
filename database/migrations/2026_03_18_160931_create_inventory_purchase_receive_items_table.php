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
        Schema::create('inventory_purchase_receive_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('purchase_receive_id')->constrained('inventory_purchase_receives')->onDelete('cascade');
            $table->foreignId('purchase_order_item_id')->constrained('inventory_purchase_order_items')->onDelete('cascade');
            $table->foreignId('product_id')->constrained('inventory_products')->onDelete('cascade');
            $table->decimal('qty_received', 10, 2);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('inventory_purchase_receive_items');
    }
};
