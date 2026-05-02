<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\Resources\PaymentScheduleResource;
use App\Models\PaymentSchedule;
use Illuminate\Http\Request;

class PaymentScheduleController extends Controller
{
    private function company(): \App\Models\Company
    {
        return app('company');
    }

    public function index(Request $request)
    {
        $query = PaymentSchedule::with([
            'clientsProject',
            'clientsProject.client',
            'clientsProject.client.clientCompanyType',
            'clientsProject.project',
            'clientsProject.payments',
            'transaction.officialReceipt.form2307',
        ])
        // Scope through payment → company_id
        ->whereHas('payment', function ($q) {
            $q->where('company_id', $this->company()->id);
        });

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

        // Fetch ALL schedules for the involved payment_ids (ignoring filters)
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
        // Scope check through payment relationship
        abort_if($schedule->payment->company_id !== $this->company()->id, 403);

        $request->validate([
            'status' => 'required|in:pending,paid,overdue,ended',
            'amount_paid'     => 'nullable|numeric',
            'withholding_tax' => 'nullable|numeric',
        ]);

        $schedule->status = $request->status;
        $schedule->save();

        if ($request->status === 'paid' && !$schedule->transaction()->exists()) {
            $schedule->paymentTransactions()->create([
                'company_id'  => $this->company()->id,
                'amount_paid' => $request->amount_paid ?? $schedule->expected_amount,
                'wh_tax'      => $request->wh_tax ?? 0,
                'paid_at'     => now(),
            ]);
        }

        return response()->json([
            'message'  => 'Payment schedule status updated successfully',
            'schedule' => $schedule,
        ]);
    }
}
