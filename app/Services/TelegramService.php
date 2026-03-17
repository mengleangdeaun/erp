<?php

namespace App\Services;

use App\Models\TelegramSetting;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class TelegramService
{
    private ?string $botToken;
    private bool $enabled;

    public function __construct()
    {
        $setting = TelegramSetting::instance();
        $this->botToken = $setting?->bot_token;
        $this->enabled = $setting?->is_active ?? false;
    }

    /**
     * Send a message to a specific chat / topic.
     */
    public function sendMessage(string $chatId, string $message, ?string $topicId = null): bool
    {
        if (!$this->enabled || !$this->botToken) {
            return false;
        }

        try {
            $payload = [
                'chat_id' => $chatId,
                'text' => $message,
                'parse_mode' => 'HTML',
            ];

            if ($topicId) {
                $payload['message_thread_id'] = $topicId;
            }

            $response = Http::post(
                "https://api.telegram.org/bot{$this->botToken}/sendMessage",
                $payload
            );

            return $response->successful();
        } catch (\Exception $e) {
            Log::error('TelegramService::sendMessage failed', ['error' => $e->getMessage()]);
            return false;
        }
    }

    /**
     * Test the bot connection.
     */
    public function testConnection(): array
    {
        if (!$this->botToken) {
            return ['success' => false, 'message' => 'Bot token not configured.'];
        }

        try {
            $response = Http::get("https://api.telegram.org/bot{$this->botToken}/getMe");
            if ($response->successful()) {
                $bot = $response->json('result');
                return [
                    'success' => true,
                    'message' => "Connected as @{$bot['username']}",
                    'bot' => $bot,
                ];
            }
            return ['success' => false, 'message' => $response->json('description') ?? 'Connection failed'];
        } catch (\Exception $e) {
            return ['success' => false, 'message' => $e->getMessage()];
        }
    }

    /**
     * Format an announcement for Telegram.
     */
    public function formatAnnouncementMessage(\App\Models\Announcement $announcement): string
    {
        $emoji = match($announcement->type) {
            'success' => '✅',
            'warning' => '⚠️',
            'danger' => '🚨',
            default => '📢',
        };

        $lines = [
            "{$emoji} <b>{$announcement->title}</b>",
            "",
        ];

        if ($announcement->short_description) {
            $lines[] = "<i>{$announcement->short_description}</i>";
            $lines[] = "";
        }

        if ($announcement->content) {
            // Strip HTML tags for Telegram but keep basic formatting if needed
            // Telegram supports <b>, <i>, <u>, <s>, <code>, <pre>, <a>
            $content = strip_tags($announcement->content, '<b><i><u><s><code><pre><a>');
            $lines[] = $content;
        }

        return implode("\n", $lines);
    }
}
