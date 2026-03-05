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
        if (!Schema::hasColumn('company_feedback', 'type')) {
            Schema::table('company_feedback', function (Blueprint $table) {
                $table->string('type')->default('positive')->after('id');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasColumn('company_feedback', 'type')) {
            Schema::table('company_feedback', function (Blueprint $table) {
                $table->dropColumn('type');
            });
        }
    }
};
