<?php

use App\Models\PaymentSchedule;
use App\Models\Subscription;
use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

app(Schedule::class)->call(function () {
    \Log::info('Scheduler ran at: ' . now());

    PaymentSchedule::where('status', 'pending')
        ->whereNotNull('due_date')
        ->whereDate('due_date', '<', now())
        ->update(['status' => 'overdue']);

    // Update project statuses based on dates
    Project::whereNotIn('status', ['complete', 'hold'])
        ->get()
        ->each(function ($project) {
            $project->update(['status' => $project->auto_status]);
        });

    \Log::info('Project statuses updated at: ' . now());

    // Update subscription statuses based on dates
    Subscription::whereNotIn('status', ['complete', 'hold'])
        ->get()
        ->each(function ($subscription){
            $subscription->update(['status' => $subscription->auto_status]);
        });
    \Log::info('Subscription statuses updated at: ' . now());
})->daily();
