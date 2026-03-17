<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

class DispatchScheduledAnnouncements extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'announcements:dispatch';

    protected $description = 'Dispatch notifications for scheduled announcements that have reached their published_at time.';

    public function handle()
    {
        $announcements = \App\Models\Announcement::where('status', 'published')
            ->where('published_at', '<=', now())
            ->whereNull('notifications_sent_at')
            ->get();

        if ($announcements->isEmpty()) {
            $this->info('No pending scheduled announcements to dispatch.');
            return;
        }

        foreach ($announcements as $announcement) {
            $this->info("Dispatching notifications for: {$announcement->title}");
            
            // Dispatch in-app notifications
            \App\Services\NotificationService::dispatchAnnouncement($announcement);

            // Dispatch Telegram
            \App\Services\NotificationService::dispatchTelegram($announcement);
            
            $announcement->update(['notifications_sent_at' => now()]);
        }

        $this->info('Dispatched ' . $announcements->count() . ' announcements.');
    }
}
