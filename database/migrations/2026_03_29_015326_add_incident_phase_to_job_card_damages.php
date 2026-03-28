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
        Schema::table('job_card_damages', function (Blueprint $table) {
            $table->string('incident_phase')->default('qc_audit')->after('qc_report_id')->index();
            $table->unsignedBigInteger('sales_order_id')->nullable()->after('job_card_id')->index();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('job_card_damages', function (Blueprint $table) {
            $table->dropColumn(['incident_phase', 'sales_order_id']);
        });
    }
};
