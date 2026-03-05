<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Create the new Pivot Table
        Schema::create('branch_department', function (Blueprint $table) {
            $table->id();
            $table->foreignId('branch_id')->constrained()->onDelete('cascade');
            $table->foreignId('department_id')->constrained()->onDelete('cascade');
            $table->timestamps();

            // Ensure unique pairs
            $table->unique(['branch_id', 'department_id']);
        });

        // 2. Safely Migrate existing relationships
        $departments = DB::table('departments')->whereNotNull('branch_id')->get();
        foreach ($departments as $department) {
            DB::table('branch_department')->insert([
                'branch_id' => $department->branch_id,
                'department_id' => $department->id,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        // 3. Drop the old column
        Schema::table('departments', function (Blueprint $table) {
            $table->dropForeign(['branch_id']);
            $table->dropColumn('branch_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('departments', function (Blueprint $table) {
            $table->foreignId('branch_id')->nullable()->constrained()->onDelete('cascade');
        });

        Schema::dropIfExists('branch_department');
    }
};
