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
        Schema::create('sales_orders', function (Blueprint $table) {
            $table->id();
            $table->string('order_no')->unique();
            $table->foreignId('customer_id')->constrained('customers')->onDelete('cascade');
            $table->foreignId('branch_id')->constrained('branches')->onDelete('cascade');
            $table->foreignId('vehicle_id')->nullable()->constrained('customer_vehicles')->onDelete('set null');
            $table->timestamp('order_date')->useCurrent();
            $table->decimal('subtotal', 15, 2)->default(0);
            $table->decimal('tax_total', 15, 2)->default(0);
            $table->decimal('discount_total', 15, 2)->default(0);
            $table->decimal('grand_total', 15, 2)->default(0);
            $table->decimal('paid_amount', 15, 2)->default(0);
            $table->decimal('balance_amount', 15, 2)->default(0);
            $table->enum('status', ['DRAFT', 'CONFIRMED', 'COMPLETED', 'CANCELLED'])->default('DRAFT');
            $table->enum('payment_status', ['UNPAID', 'PARTIAL', 'PAID'])->default('UNPAID');
            $table->text('notes')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users');
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('sales_order_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('sales_order_id')->constrained('sales_orders')->onDelete('cascade');
            $table->nullableMorphs('itemable'); // Can be inventory_product or service
            $table->string('item_name');
            $table->text('description')->nullable();
            $table->decimal('quantity', 15, 2)->default(1);
            $table->decimal('unit_price', 15, 2)->default(0);
            $table->decimal('discount_amount', 15, 2)->default(0);
            $table->decimal('tax_amount', 15, 2)->default(0);
            $table->decimal('subtotal', 15, 2)->default(0);
            $table->timestamps();
        });

        Schema::create('job_cards', function (Blueprint $table) {
            $table->id();
            $table->string('job_no')->unique();
            $table->foreignId('sales_order_id')->nullable()->constrained('sales_orders')->onDelete('set null');
            $table->foreignId('branch_id')->constrained('branches')->onDelete('cascade');
            $table->foreignId('customer_id')->constrained('customers')->onDelete('cascade');
            $table->foreignId('vehicle_id')->constrained('customer_vehicles')->onDelete('cascade');
            $table->decimal('mileage_in', 12, 2)->nullable();
            $table->timestamp('started_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->enum('status', ['PENDING', 'IN_PROGRESS', 'QC', 'COMPLETED', 'CANCELLED'])->default('PENDING');
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('job_card_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('job_card_id')->constrained('job_cards')->onDelete('cascade');
            $table->foreignId('service_id')->nullable()->constrained('services')->onDelete('set null');
            $table->foreignId('part_id')->nullable()->constrained('job_parts_master')->onDelete('set null');
            $table->foreignId('technician_id')->nullable()->constrained('employees')->onDelete('set null');
            $table->enum('status', ['PENDING', 'IN_PROGRESS', 'COMPLETED'])->default('PENDING');
            $table->timestamp('started_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        Schema::create('job_card_material_usage', function (Blueprint $table) {
            $table->id();
            $table->foreignId('job_card_id')->constrained('job_cards')->onDelete('cascade');
            $table->foreignId('job_card_item_id')->constrained('job_card_items')->onDelete('cascade');
            $table->foreignId('product_id')->constrained('inventory_products')->onDelete('cascade');
            $table->decimal('spent_qty', 15, 4)->default(0);
            $table->decimal('actual_qty', 15, 4)->default(0);
            $table->string('unit')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('job_card_material_usage');
        Schema::dropIfExists('job_card_items');
        Schema::dropIfExists('job_cards');
        Schema::dropIfExists('sales_order_items');
        Schema::dropIfExists('sales_orders');
    }
};
