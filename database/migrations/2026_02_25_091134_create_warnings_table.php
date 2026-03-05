<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('warnings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employee_id')->constrained()->cascadeOnDelete();
            $table->string('warning_by');             // Name or designation of issuer
            $table->string('warning_type');           // e.g. Verbal, Written, Final
            $table->string('subject');
            $table->enum('severity', ['low', 'medium', 'high'])->default('medium');
            $table->date('warning_date');
            $table->text('description')->nullable();
            $table->string('document')->nullable();
            $table->date('expiry_date')->nullable();
            // Improvement Plan
            $table->boolean('has_improvement_plan')->default(false);
            $table->text('ip_goal')->nullable();
            $table->date('ip_start_date')->nullable();
            $table->date('ip_end_date')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('warnings');
    }
};
