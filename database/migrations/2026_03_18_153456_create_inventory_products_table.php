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
        Schema::create('inventory_products', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique();
            $table->string('sku')->unique()->nullable();
            $table->string('barcode')->unique()->nullable();
            $table->foreignId('category_id')->nullable()->constrained('inventory_categories')->onDelete('set null');
            $table->foreignId('base_uom_id')->nullable()->constrained('inventory_uoms')->onDelete('set null');
            $table->foreignId('purchase_uom_id')->nullable()->constrained('inventory_uoms')->onDelete('set null');
            $table->decimal('uom_multiplier', 10, 4)->default(1.0000);
            $table->decimal('length', 10, 2)->nullable();
            $table->decimal('width', 10, 2)->nullable();
            $table->string('brand')->nullable();
            $table->string('name');
            $table->string('img')->nullable();
            $table->text('description')->nullable();
            $table->decimal('cost', 10, 2)->default(0.00);
            $table->decimal('price', 10, 2)->default(0.00);
            $table->integer('reorder_level')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('inventory_products');
    }
};
