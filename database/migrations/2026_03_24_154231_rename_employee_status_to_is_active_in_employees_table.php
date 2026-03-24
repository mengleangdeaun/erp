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
            $table->renameColumn('status', 'is_active');
        });

        // Convert string data to boolean-ready string
        DB::table('employees')->where('is_active', 'active')->update(['is_active' => '1']);
        DB::table('employees')->where('is_active', '!=', '1')->update(['is_active' => '0']);

        // Change type to boolean
        Schema::table('employees', function (Blueprint $table) {
            $table->boolean('is_active')->default(1)->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('employees', function (Blueprint $table) {
            $table->renameColumn('is_active', 'status');
        });

        Schema::table('employees', function (Blueprint $table) {
            $table->enum('status', ['active', 'inactive'])->default('active')->change();
        });

        DB::table('employees')->where('status', '1')->update(['status' => 'active']);
        DB::table('employees')->where('status', '0')->update(['status' => 'inactive']);
    }
};
