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
        Schema::create('leave_policies', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->text('description')->nullable();
            $table->foreignId('leave_type_id')->constrained('leave_types')->onDelete('cascade');
            $table->enum('accrual_type', ['fixed', 'monthly', 'yearly'])->default('fixed');
            $table->decimal('accrual_rate', 8, 2)->default(0);
            $table->integer('carry_forward_limit')->default(0);
            $table->integer('min_days_per_app')->default(1);
            $table->integer('max_days_per_app')->default(0); // 0 means no limit
            $table->boolean('require_approval')->default(true);
            $table->boolean('status')->default(true);
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('leave_policies');
    }
};
