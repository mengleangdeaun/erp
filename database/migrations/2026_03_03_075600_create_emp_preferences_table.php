<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('emp_preferences', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employee_id')->constrained()->onDelete('cascade');
            $table->string('font_family', 50)->default('Inter');
            $table->string('font_size', 20)->default('medium');   // small | medium | large
            $table->string('color_theme', 30)->default('default');
            $table->boolean('dark_mode')->default(false);
            $table->boolean('notifications_enabled')->default(true);
            $table->timestamps();

            $table->unique('employee_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('emp_preferences');
    }
};
