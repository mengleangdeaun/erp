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
        Schema::create('customer_vehicles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('customer_id')->constrained('customers')->onDelete('cascade');
            $table->foreignId('brand_id')->nullable()->constrained('vehicle_brands')->onDelete('set null');
            $table->foreignId('model_id')->nullable()->constrained('vehicle_models')->onDelete('set null');
            $table->string('plate_number')->unique()->nullable();
            $table->string('vin_last_4', 4)->nullable();
            $table->string('color')->nullable();
            $table->decimal('current_mileage', 12, 2)->default(0);
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('customer_vehicles');
    }
};
