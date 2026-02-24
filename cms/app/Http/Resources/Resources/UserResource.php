<?php

namespace App\Http\Resources\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    public static $wrap = false;
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id'=> $this->id,
            'name'=> $this->name,
            'email'=> $this->email,
            'created_at'=> $this->created_at->format('Y-m-d'),
            'roles' => $this->roles->map(fn ($role) => [
                'id'    => $role->id,
                'name'  => $role->name,
                'label' => $role->label,
            ]),
        ];
    }
}
