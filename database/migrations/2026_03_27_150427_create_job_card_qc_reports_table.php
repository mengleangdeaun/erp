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
        Schema::create('job_card_qc_reports', function (Blueprint $table) {
            $table->id();
            $table->foreignId('job_card_id')->constrained()->onDelete('cascade');
            $table->foreignId('qc_person_id')->constrained('employees');
            $table->integer('rating')->default(5);
            $table->enum('decision', ['PASS', 'FAIL']);
            $table->json('damages')->nullable();
            $table->json('item_evaluations')->nullable();
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
        Schema::dropIfExists('job_card_qc_reports');
    }
};
