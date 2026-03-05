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
        Schema::table('attendance_records', function (Blueprint $table) {
            $table->datetime('session_2_clock_in_time')->nullable()->after('clock_out_location');
            $table->datetime('session_2_clock_out_time')->nullable()->after('session_2_clock_in_time');
            $table->string('session_2_clock_in_location')->nullable()->after('session_2_clock_out_time')->comment('Lat,Lng when clocked in for session 2');
            $table->string('session_2_clock_out_location')->nullable()->after('session_2_clock_in_location')->comment('Lat,Lng when clocked out for session 2');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('attendance_records', function (Blueprint $table) {
            $table->dropColumn([
                'session_2_clock_in_time',
                'session_2_clock_out_time',
                'session_2_clock_in_location',
                'session_2_clock_out_location'
            ]);
        });
    }
};
