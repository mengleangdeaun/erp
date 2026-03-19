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
        Schema::create('inventory_stock_adjustments', function (Blueprint $table) {
            $table->id();
            $table->string('adjustment_no')->unique();
            $table->date('date');
            $table->foreignId('user_id')->constrained('users');
            $table->text('notes')->nullable();
            $table->enum('status', ['DRAFT', 'COMPLETED'])->default('DRAFT');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('inventory_stock_adjustments');
    }
};
