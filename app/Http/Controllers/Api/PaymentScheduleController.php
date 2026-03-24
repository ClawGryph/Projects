<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\Resources\PaymentScheduleResource;
use App\Models\PaymentSchedule;
use Illuminate\Http\Request;

class PaymentScheduleController extends Controller
{
    public function index(Request $request)
    {
        $query = PaymentSchedule::with([
            'clientsProject',
            'clientsProject.client',
            'clientsProject.project',
            'clientsProject.payments',
            'transaction.officialReceipt.form2307',
        ]);

        if ($request->filled('month')) {
            $query->where('due_date', 'like', $request->month . '%');
        }

        if ($request->filled('project_id')) {
            $query->whereHas('clientsProject.project', function ($q) use ($request) {
                $q->where('id', $request->project_id);
            });
        }

        $sortDirection = $request->get('direction', 'asc');
        $query->orderBy('due_date', $sortDirection);

        $schedules = $query->get();

        // Fetch ALL schedules for the involved clients_project_ids (ignoring filters)
        $paymentIds = $schedules->pluck('payment_id')->unique();

        $allSchedules = PaymentSchedule::whereIn('payment_id', $paymentIds)
                        ->orderBy('due_date', 'asc')
                        ->get()
                        ->groupBy('payment_id');

        // Attach schedule_index and total_schedules to each result
        $schedules->each(function ($schedule) use ($allSchedules) {
             $group = $allSchedules->get($schedule->payment_id, collect());
            $schedule->schedule_index = $group->search(fn($s) => $s->id === $schedule->id) + 1;
            $schedule->total_schedules = $group->count();
        });

        return PaymentScheduleResource::collection($schedules);
    }

    public function updateStatus(Request $request, PaymentSchedule $schedule)
    {
        $request->validate([
            'status' => 'required|in:pending,paid,overdue,ended',
        ]);

        // Update schedule status
        $schedule->status = $request->status;
        $schedule->save();

        // Optionally, create a transaction if marked as paid
        if ($request->status === 'paid' && !$schedule->transaction()->exists()) {
            $schedule->paymentTransactions()->create([
                'amount_paid' => $schedule->expected_amount,
                'paid_at' => now(),
            ]);
        }

        return response()->json([
            'message' => 'Payment schedule status updated successfully',
            'schedule' => $schedule,
        ]);
    }
}
