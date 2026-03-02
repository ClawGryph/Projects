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
            'clientsProject.client',
            'clientsProject.project',
            'clientsProject.payments',
        ]);

        // Filter by month (format: YYYY-MM)
        if ($request->filled('month')) {
            $query->where('due_date', 'like', $request->month . '%');
        }

        // Filter by project
        if ($request->filled('project_id')) {
            $query->whereHas('clientsProject.project', function ($q) use ($request) {
                $q->where('id', $request->project_id);
            });
        }

        // Optional sorting
        $sortDirection = $request->get('direction', 'asc');
        $query->orderBy('due_date', $sortDirection);

        return PaymentScheduleResource::collection(
            $query->get()
        );
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
        if ($request->status === 'paid') {
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
