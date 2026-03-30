<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateClientRequest;
use App\Http\Resources\Resources\ClientResource;
use App\Models\Client;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ClientController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    private function company(): \App\Models\Company
    {
        return app('company');
    }

    public function index()
    {
        return ClientResource::collection(
            Client::query()
                ->where('company_id', $this->company()->id)
                ->orderBy('id', 'desc')
                ->paginate(10)
        );
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'email' => ['required', 'email', Rule::unique('clients','email')->where('company_id', $this->company()->id)],
            'phone_number' => 'required',
            'company_name' => 'required',
            'company_address' => 'required',
            'company_type' => 'required|in:Private Individual,Private Corp,Government',
        ]);

        $data['company_id'] = $this->company()->id;

        $client = Client::create($data);

        return new ClientResource($client);
    }

    /**
     * Display the specified resource.
     */
    public function show(Client $client)
    {
        abort_if($client->company_id !== $this->company()->id, 403);

        return new ClientResource($client);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateClientRequest $request, Client $client)
    {
        abort_if($client->company_id !== $this->company()->id, 403);

        $data = $request->validated();
        $client->update($data);

        return new ClientResource($client);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Client $client)
    {
        abort_if($client->company_id !== $this->company()->id, 403);

        $client->delete();

        return response('', 204);
    }
}
