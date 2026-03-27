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
        Schema::table('job_cards', function (Blueprint $table) {
            $table->string('type')->default('installation')->after('job_no');
            $table->unsignedBigInteger('parent_id')->nullable()->after('type');
            $table->unsignedBigInteger('replacement_type_id')->nullable()->after('parent_id');

            $table->foreign('parent_id')->references('id')->on('job_cards')->onDelete('set null');
            $table->foreign('replacement_type_id')->references('id')->on('job_card_replacement_types')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('job_cards', function (Blueprint $table) {
            //
        });
    }
};
