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
        Schema::create('document_settings', function (Blueprint $table) {
            $table->id();
            $table->string('document_type')->unique(); // e.g. purchase_order, stock_transfer
            $table->string('prefix')->nullable();
            $table->string('suffix')->nullable();
            $table->integer('number_padding')->default(4); // e.g. 4 -> 0001
            $table->integer('next_number')->default(1);
            $table->boolean('is_yearly_reset')->default(false);
            $table->boolean('is_monthly_reset')->default(false);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('document_settings');
    }
};
