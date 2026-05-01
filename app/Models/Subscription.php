<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Subscription extends Model
{
    protected $fillable = [
        'company_id',
        'subscription_id',
        'title',
        'description',
        'start_coverage',
        'end_coverage',
        'adjusted_start_coverage',
        'adjusted_end_coverage',
        'cr_no',
        'cost',
        'type',
        'status',
        'created_at'
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
        'adjusted_start_date' => 'date',
        'adjusted_end_date'   => 'date',
    ];

    public function getAutoStatusAttribute(): string
    {
        // These are always manually locked
        if (in_array($this->status, ['complete', 'hold'])) {
            return $this->status;
        }

        $today = now()->startOfDay();
        $start = $this->adjusted_start_date ?? $this->start_date;
        $end = $this->adjusted_end_date ?? $this->end_date;

        // Past end date and not complete → delay
        if ($end && $today->gt($end) && $this->status !== 'complete') {
            return 'delay';
        }

        // Before start date → pending
        if ($start && $today->lt($start)) return 'pending';

        // Within the window → ongoing
        if ($start && $today->gte($start)) return 'ongoing';

        // Fallback to whatever is manually stored
        return $this->status ?? 'pending';
    }
}
