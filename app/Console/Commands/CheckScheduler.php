<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Announcement;
use Carbon\Carbon;

class CheckScheduler extends Command
{
    protected $signature = 'announcements:debug';
    protected $description = 'Debug command to check scheduler state and pending announcements';

    public function handle()
    {
        $this->newLine();
        $this->info('--- Announcement Scheduler Debug ---');
        
        $this->comment('Time and Timezone:');
        $this->line('  System Time: ' . Carbon::now()->toDateTimeString());
        $this->line('  Timezone:    ' . config('app.timezone'));
        $this->line('  UTC Time:       ' . Carbon::now('UTC')->toDateTimeString());
        
        $pending = Announcement::where('status', 'published')
            ->whereNull('notifications_sent_at')
            ->get();
            
        $this->newLine();
        $this->comment('Pending Announcements (' . $pending->count() . '):');
        
        if ($pending->isEmpty()) {
            $this->line('  None found.');
        } else {
            foreach ($pending as $a) {
                $status = Carbon::parse($a->published_at)->isPast() ? '<fg=green>READY</>' : '<fg=yellow>WAITING</>';
                $this->line("  ID: {$a->id} | Title: {$a->title}");
                $this->line("  Scheduled for: {$a->published_at} ($status)");
                $this->newLine();
            }
        }

        $this->comment('Server Requirement:');
        $this->line('  To run the scheduler automatically, you must have `php artisan schedule:work` running in a terminal.');
        
        $this->newLine();
        $this->info('--- End Debug ---');
        $this->newLine();
    }
}
