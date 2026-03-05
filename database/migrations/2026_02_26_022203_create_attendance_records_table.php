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
        Schema::create('attendance_records', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employee_id')->constrained('employees')->cascadeOnDelete();
            $table->date('date');
            $table->datetime('clock_in_time');
            $table->datetime('clock_out_time')->nullable();
            $table->string('clock_in_location')->nullable()->comment('Lat,Lng when clocked in');
            $table->string('clock_out_location')->nullable()->comment('Lat,Lng when clocked out');
            $table->enum('status', ['Present', 'Late', 'Half Day', 'Absent', 'Leave'])->default('Present');
            $table->timestamps();
            
            // An employee should only have one attendance record per day
            $table->unique(['employee_id', 'date']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('attendance_records');
    }
};
