<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateSubscriptionRequest;
use App\Http\Resources\Resources\SubscriptionResource;
use App\Models\Subscription;
use App\Models\SubscriptionLog;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class SubscriptionController extends Controller
{
    private function company(): \App\Models\Company
    {
        return app('company');
    }

    public function index()
    {
        return SubscriptionResource::collection(
            Subscription::query()->where('company_id', $this->company()->id)->orderBy('subscription_id', 'desc')->paginate(10)
        );
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'title' => 'required|string|max:50',
            'description' => 'required|max:200',
            'start_coverage' => 'required',
            'end_coverage' => 'required',
            'cost' => 'required',
            'type' => 'required|string|in:weekly,monthly,yearly',
        ]);

        $data['company_id'] = $this->company()->id;
        $data['subscription_id'] = $this->generateSubscriptionId();

        $subscription = Subscription::create($data);

        // Set initial status based on dates
        $subscription->update(['status' => $subscription->auto_status]);

        return new SubscriptionResource($subscription);
    }

    /**
     * Display the specified resource.
     */
    public function show(Subscription $subscription)
    {
        abort_if($subscription->company_id !== $this->company()->id, 403);
        return new SubscriptionResource($subscription);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateSubscriptionRequest $request, Subscription $subscription)
    {
        abort_if($subscription->company_id !== $this->company()->id, 403);
        $data = $request->validated();

        $watchedFields = ['start_coverage', 'end_coverage', 'adjusted_start_coverage', 'adjusted_end_coverage'];
        foreach ($watchedFields as $field) {
            $old = $subscription->$field?->toDateString();
            $new = isset($data[$field]) && $data[$field] ? Carbon::parse($data[$field])->toDateString() : null;

            if ($old != $new) {
                // If adjusted date is being set for the first time, use the original date as old_value
                if ($field === 'adjusted_start_coverage' && !$old) {
                    $old = $subscription->start_coverage?->toDateString();
                }
                if ($field === 'adjusted_end_coverage' && !$old) {
                    $old = $subscription->end_coverage?->toDateString();
                }

                SubscriptionLog::create([
                    'subscription_id' => $subscription->id,
                    'user_id'    => $request->user()->id,
                    'field'      => $field,
                    'old_value'  => $old,
                    'new_value'  => $new,
                    'cr_no'      => $data['cr_no'] ?? null,
                ]);
            }
        }

        $subscription->update($data);
        return new SubscriptionResource($subscription);

    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Subscription $subscription)
    {
        abort_if($subscription->company_id !== $this->company()->id, 403);

        $subscription->delete();

        return response('', 204);
    }

    public function updateStatus(Request $request, Subscription $subscription)
    {
        abort_if($subscription->company_id !== $this->company()->id, 403);

        $request->validate([
            'status' => 'required|string|in:pending,ongoing,complete,hold,delay'
        ]);

        $subscription->update([
            'status' => $request->status
        ]);

        return response()->json([
            'message' => 'Status updated successfully'
        ]);
    }

    private function generateSubscriptionId(): string
    {
        do {
            $id = 'S' . random_int(100, 999);
        } while (Subscription::where('subscription_id', $id)->exists());

        return $id;
    }

    public function logs(Subscription $subscription)
    {
        abort_if($subscription->company_id !== $this->company()->id, 403);

        return $subscription->logs()
            ->with('user:id,name')
            ->latest()
            ->get();
    }
}
