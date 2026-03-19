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
        Schema::create('inventory_stock_adjustment_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('adjustment_id')->constrained('inventory_stock_adjustments')->onDelete('cascade');
            $table->foreignId('product_id')->constrained('inventory_products');
            $table->foreignId('location_id')->constrained('inventory_locations');
            
            $table->decimal('current_qty', 14, 4);
            $table->decimal('adjustment_qty', 14, 4);
            $table->decimal('new_qty', 14, 4);
            
            $table->string('reason')->nullable(); // Damage, Lost, Found, etc.
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('inventory_stock_adjustment_items');
    }
};
