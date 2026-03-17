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
        Schema::create('announcements', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->string('type')->default('info'); // info, success, warning, danger
            $table->text('short_description')->nullable();
            $table->longText('content')->nullable();
            $table->dateTime('start_date')->nullable();
            $table->dateTime('end_date')->nullable();
            $table->json('attachments')->nullable();
            $table->boolean('is_featured')->default(false);
            $table->string('targeting_type')->default('all'); // all, branch, department, employee
            $table->json('target_ids')->nullable();
            $table->dateTime('published_at')->nullable();
            $table->string('status')->default('draft'); // draft, published, expired
            $table->foreignId('created_by')->constrained('users');
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('announcements');
    }
};
