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
        Schema::create('job_card_damages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('job_card_id')->constrained('job_cards')->onDelete('cascade');
            $table->foreignId('job_card_item_id')->constrained('job_card_items')->onDelete('cascade');
            $table->foreignId('qc_report_id')->constrained('job_card_qc_reports')->onDelete('cascade');
            $table->json('mistake_staff_ids')->nullable();
            $table->json('rework_staff_ids')->nullable();
            $table->foreignId('reason_id')->nullable()->constrained('job_card_replacement_types');
            $table->integer('rating')->default(1);
            $table->text('notes')->nullable();
            $table->string('status')->default('unfixed'); // unfixed, fixed, verified
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('job_card_damages');
    }
};
