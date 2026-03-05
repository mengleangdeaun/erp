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
        Schema::table('employees', function (Blueprint $table) {
            $table->index('branch_id');
            $table->index('department_id');
            $table->index('designation_id');
            $table->index('status');
            $table->index('full_name');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('employees', function (Blueprint $table) {
            $table->dropIndex(['branch_id']);
            $table->dropIndex(['department_id']);
            $table->dropIndex(['designation_id']);
            $table->dropIndex(['status']);
            $table->dropIndex(['full_name']);
        });
    }
};
