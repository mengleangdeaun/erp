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
            $table->foreignId('technician_lead_id')->nullable()->after('vehicle_id')->constrained('employees')->onDelete('set null');
        });

        Schema::create('job_card_item_technician', function (Blueprint $table) {
            $table->id();
            $table->foreignId('job_card_item_id')->constrained('job_card_items')->onDelete('cascade');
            $table->foreignId('employee_id')->constrained('employees')->onDelete('cascade');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('job_card_item_technician');
        Schema::table('job_cards', function (Blueprint $table) {
            $table->dropForeign(['technician_lead_id']);
            $table->dropColumn('technician_lead_id');
        });
    }
};
