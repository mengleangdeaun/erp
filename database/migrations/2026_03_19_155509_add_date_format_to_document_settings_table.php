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
            $table->string('date_format')->nullable()->after('suffix');
            $table->string('separator', 5)->default('-')->after('date_format');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('document_settings', function (Blueprint $table) {
            //
        });
    }
};
