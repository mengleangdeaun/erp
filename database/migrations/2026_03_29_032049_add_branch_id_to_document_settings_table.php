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
        Schema::table('document_settings', function (Blueprint $table) {
            $table->foreignId('branch_id')->nullable()->constrained('branches')->onDelete('cascade');
            $table->boolean('include_branch_code')->default(false);
            
            // Unique constraint to allow per-branch settings for each type
            $table->unique(['document_type', 'branch_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('document_settings', function (Blueprint $table) {
            $table->dropUnique(['document_type', 'branch_id']);
            $table->dropForeign(['branch_id']);
            $table->dropColumn(['branch_id', 'include_branch_code']);
        });
    }
};
