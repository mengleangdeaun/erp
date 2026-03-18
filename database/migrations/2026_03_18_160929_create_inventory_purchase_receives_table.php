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
        Schema::create('inventory_purchase_receives', function (Blueprint $table) {
            $table->id();
            $table->foreignId('purchase_order_id')->constrained('inventory_purchase_orders')->onDelete('cascade');
            $table->foreignId('location_id')->constrained('inventory_locations')->onDelete('cascade');
            $table->dateTime('receive_date');
            $table->string('reference_number')->nullable();
            $table->text('receiving_note')->nullable();
            $table->enum('status', ['Draft', 'Received'])->default('Draft');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('inventory_purchase_receives');
    }
};
