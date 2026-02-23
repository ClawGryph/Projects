<?php

use App\Models\PaymentSchedule;
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
})->everyMinute();
