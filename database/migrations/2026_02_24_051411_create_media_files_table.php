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
        Schema::create('media_files', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('extension')->nullable();
            $table->string('file_type')->nullable(); // photo, video, audio, document, other
            $table->unsignedBigInteger('size_bytes')->nullable();
            $table->string('size_human')->nullable();
            $table->string('mime_type')->nullable();
            $table->string('url')->nullable();
            $table->boolean('is_favorite')->default(false);
            $table->unsignedBigInteger('folder_id')->nullable();
            $table->foreign('folder_id')->references('id')->on('media_folders')->cascadeOnDelete();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('media_files');
    }
};
