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
        Schema::create('inventory_stock_movements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained('inventory_products')->onDelete('cascade');
            $table->foreignId('location_id')->constrained('inventory_locations')->onDelete('cascade');
            $table->foreignId('user_id')->nullable()->constrained('users')->onDelete('set null');
            $table->string('movement_type'); // e.g., PURCHASE_RECEIVE, ADJUSTMENT_DAMAGE, etc.
            $table->decimal('quantity', 14, 4); // Use higher precision for stock
            $table->decimal('previous_quantity', 14, 4);
            $table->decimal('current_quantity', 14, 4);
            $table->string('reference_type', 100)->nullable(); // Limited to 100 for key length
            $table->unsignedBigInteger('reference_id')->nullable();
            $table->text('reason')->nullable();
            $table->timestamps();

            $table->index(['reference_type', 'reference_id']);
            $table->index('movement_type');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('inventory_stock_movements');
    }
};
