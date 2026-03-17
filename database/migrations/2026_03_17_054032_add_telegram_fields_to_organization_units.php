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
        Schema::table('branches', function (Blueprint $table) {
            $table->string('telegram_chat_id')->nullable()->after('allowed_radius');
            $table->string('telegram_topic_id')->nullable()->after('telegram_chat_id');
        });

        Schema::table('departments', function (Blueprint $table) {
            $table->string('telegram_chat_id')->nullable();
            $table->string('telegram_topic_id')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('branches', function (Blueprint $table) {
            $table->dropColumn(['telegram_chat_id', 'telegram_topic_id']);
        });

        Schema::table('departments', function (Blueprint $table) {
            $table->dropColumn(['telegram_chat_id', 'telegram_topic_id']);
        });
    }
};
