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
        Schema::create('inventory_purchase_orders', function (Blueprint $table) {
            $table->id();
            $table->foreignId('supplier_id')->constrained('inventory_suppliers')->onDelete('cascade');
            $table->string('po_number')->unique();
            $table->dateTime('order_date');
            $table->date('expected_delivery_date')->nullable();
            $table->enum('status', ['Draft', 'Ordered', 'Partial', 'Completed', 'Cancelled'])->default('Draft');
            $table->decimal('total_amount', 12, 2)->default(0);
            $table->text('note')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('inventory_purchase_orders');
    }
};
