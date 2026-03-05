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
        // 1. Create the new Pivot Table
        Schema::create('department_designation', function (Blueprint $table) {
            $table->id();
            $table->foreignId('department_id')->constrained()->onDelete('cascade');
            $table->foreignId('designation_id')->constrained('designations')->onDelete('cascade');
            $table->timestamps();
            
            // Ensure unique pairs
            $table->unique(['department_id', 'designation_id']);
        });

        // 2. Safely Migrate existing relationships
        $designations = DB::table('designations')->whereNotNull('department_id')->get();
        foreach ($designations as $designation) {
            DB::table('department_designation')->insert([
                'department_id' => $designation->department_id,
                'designation_id' => $designation->id,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        // 3. Drop the old column
        Schema::table('designations', function (Blueprint $table) {
            // First drop foreign key if it exists, ignoring errors if it doesn't
            try {
                $table->dropForeign(['department_id']);
            } catch (\Exception $e) {}
            
            $table->dropColumn('department_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // 1. Add back the old column
        Schema::table('designations', function (Blueprint $table) {
            $table->foreignId('department_id')->nullable()->constrained()->onDelete('cascade');
        });

        // 2. Attempt to restore data (takes the first pivot entry per designation)
        $pivots = DB::table('department_designation')->get()->groupBy('designation_id');
        foreach ($pivots as $designationId => $group) {
            $firstDepartment = $group->first();
            DB::table('designations')
                ->where('id', $designationId)
                ->update(['department_id' => $firstDepartment->department_id]);
        }

        // 3. Drop the pivot table
        Schema::dropIfExists('department_designation');
    }
};
