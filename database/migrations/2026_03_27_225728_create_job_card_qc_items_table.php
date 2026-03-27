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
        Schema::create('job_card_qc_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('qc_report_id')->constrained('job_card_qc_reports')->onDelete('cascade');
            $table->foreignId('job_card_item_id')->constrained('job_card_items');
            $table->integer('rating')->default(5);
            $table->enum('status', ['PASS', 'FAIL'])->default('PASS');
            $table->foreignId('replacement_type_id')->nullable()->constrained('job_card_replacement_types');
            $table->foreignId('rework_technician_id')->nullable()->constrained('employees');
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('job_card_qc_items');
    }
};
