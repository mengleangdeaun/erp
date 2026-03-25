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
        Schema::create('inventory_serial_movements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('serial_id')->constrained('inventory_product_serials')->onDelete('cascade');
            $table->foreignId('product_id')->constrained('inventory_products')->onDelete('cascade');
            $table->foreignId('location_id')->nullable()->constrained('inventory_locations')->onDelete('set null');
            $table->foreignId('user_id')->nullable()->constrained('users')->onDelete('set null');
            $table->string('movement_type'); // e.g., PURCHASE_RECEIVE, JOB_CARD_CONSUMPTION
            $table->decimal('quantity', 14, 4); // SQM change
            $table->decimal('width', 14, 4)->nullable();
            $table->decimal('height', 14, 4)->nullable();
            $table->decimal('previous_quantity', 14, 4);
            $table->decimal('current_quantity', 14, 4);
            $table->string('reference_type')->nullable();
            $table->unsignedBigInteger('reference_id')->nullable();
            $table->text('reason')->nullable();
            $table->timestamps();

            $table->index(['reference_type', 'reference_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('inventory_serial_movements');
    }
};
