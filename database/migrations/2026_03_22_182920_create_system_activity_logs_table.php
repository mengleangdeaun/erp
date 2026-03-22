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
        Schema::create('system_activity_logs', function (Blueprint $table) {
            $table->id();
            $table->string('log_name')->nullable()->index();
            $table->text('description');
            
            // The model being manipulated
            $table->nullableMorphs('subject', 'subject');
            
            // The user manipulating the model
            $table->nullableMorphs('causer', 'causer');
            
            $table->string('event')->nullable();
            
            // Store old/new values
            $table->json('properties')->nullable();
            
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('system_activity_logs');
    }
};
