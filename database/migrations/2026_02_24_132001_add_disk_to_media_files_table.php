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
        Schema::table('media_files', function (Blueprint $table) {
            $table->string('disk')->default('public')->after('folder_id'); 
            // the disk indicates where this specific file is physically stored ('public', 's3', 'gdrive')
            // so we can seamlessly switch global configurations without breaking existing old files
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('media_files', function (Blueprint $table) {
            $table->dropColumn('disk');
        });
    }
};
