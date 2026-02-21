<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\Resources\PaymentScheduleResource;
use App\Models\PaymentSchedule;
use Illuminate\Http\Request;

class PaymentScheduleController extends Controller
{
    public function index()
    {
        return PaymentScheduleResource::collection(
            PaymentSchedule::orderBy('due_date', 'asc')->get()
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
