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
        Schema::create('services', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('code')->unique();
            $table->decimal('base_price', 15, 2)->default(0);
            $table->text('description')->nullable();
            $table->foreignId('category_id')->nullable()->constrained('inventory_categories')->onDelete('set null');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('service_materials', function (Blueprint $table) {
            $table->id();
            $table->foreignId('service_id')->constrained('services')->onDelete('cascade');
            $table->foreignId('product_id')->constrained('inventory_products')->onDelete('cascade');
            $table->decimal('suggested_qty', 10, 2)->default(1);
            $table->timestamps();
        });

        Schema::create('job_parts_master', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('type')->comment('PPF, HPF, etc');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('service_parts_mapping', function (Blueprint $table) {
            $table->id();
            $table->foreignId('service_id')->constrained('services')->onDelete('cascade');
            $table->foreignId('part_id')->constrained('job_parts_master')->onDelete('cascade');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('service_parts_mapping');
        Schema::dropIfExists('job_parts_master');
        Schema::dropIfExists('service_materials');
        Schema::dropIfExists('services');
    }
};
