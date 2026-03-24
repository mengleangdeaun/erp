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
        Schema::create('inventory_product_serials', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained('inventory_products')->onDelete('cascade');
            $table->string('serial_number')->unique();
            $table->decimal('initial_quantity', 15, 4)->default(0);
            $table->decimal('current_quantity', 15, 4)->default(0);
            $table->decimal('width', 15, 4)->nullable();
            $table->foreignId('branch_id')->nullable()->constrained('branches')->onDelete('set null');
            $table->string('status')->default('Available'); // Available, Used, Empty, Damaged
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('inventory_product_serials');
    }
};
