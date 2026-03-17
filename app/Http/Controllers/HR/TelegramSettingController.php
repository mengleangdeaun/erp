<?php

namespace App\Http\Controllers\HR;

use App\Http\Controllers\Controller;
use App\Models\TelegramSetting;
use App\Services\TelegramService;
use Illuminate\Http\Request;

class TelegramSettingController extends Controller
{
    public function show()
    {
        $setting = TelegramSetting::instance();
        if (!$setting) {
            return response()->json(null);
        }

        return response()->json([
            'id'              => $setting->id,
            'bot_username'    => $setting->bot_username,
            'has_token'       => !empty($setting->bot_token),
            'global_chat_id'  => $setting->global_chat_id,
            'global_topic_id' => $setting->global_topic_id,
            'is_active'       => $setting->is_active,
        ]);
    }

    public function save(Request $request)
    {
        $validated = $request->validate([
            'bot_token'       => 'nullable|string',
            'global_chat_id'  => 'nullable|string',
            'global_topic_id' => 'nullable|string',
            'is_active'       => 'boolean',
        ]);

        $setting = TelegramSetting::firstOrNew([]);
        $setting->fill($validated);
        $setting->save();

        return response()->json(['message' => 'Telegram settings saved.']);
    }

    public function test()
    {
        $service = new TelegramService();
        $result = $service->testConnection();

        // Update bot_username if successfully connected
        if ($result['success'] && isset($result['bot']['username'])) {
            $setting = TelegramSetting::instance();
            $setting?->update(['bot_username' => $result['bot']['username']]);
        }

        return response()->json($result);
    }
}
