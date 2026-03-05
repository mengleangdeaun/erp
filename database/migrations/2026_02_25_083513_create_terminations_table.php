<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('terminations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employee_id')->constrained()->cascadeOnDelete();
            $table->string('termination_type'); // e.g. Resignation, Layoff, Misconduct, End of Contract
            $table->date('notice_date')->nullable();
            $table->date('termination_date');
            $table->unsignedTinyInteger('notice_period')->default(30)->comment('In days');
            $table->text('reason')->nullable();
            $table->text('description')->nullable();
            $table->string('document')->nullable();
            $table->enum('status', ['pending', 'approved', 'rejected'])->default('pending');
            $table->boolean('exit_interview_conducted')->default(false);
            $table->date('exit_interview_date')->nullable();
            $table->text('exit_feedback')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('terminations');
    }
};
