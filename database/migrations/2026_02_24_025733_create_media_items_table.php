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
        Schema::create('media_items', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->enum('type', ['folder', 'image', 'video', 'document', 'other'])->default('other');
            $table->string('size')->nullable(); // e.g. "2.5 MB"
            $table->boolean('is_favorite')->default(false);
            $table->string('extension')->nullable();
            $table->string('path')->nullable(); // For file storage path
            $table->unsignedBigInteger('parent_id')->nullable(); // For subfolders
            
            $table->foreign('parent_id')->references('id')->on('media_items')->onDelete('cascade');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('media_items');
    }
};
