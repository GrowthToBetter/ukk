<?php

namespace App\Http\Requests\Api\Admin;

use Illuminate\Foundation\Http\FormRequest;

class UpdateSpaceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'nama_space' => 'sometimes|string|max:255',
            'harga_per_jam' => 'sometimes|numeric|min:0',
            'tipe' => 'sometimes|in:desk,meeting_room,private_office',
            'kapasitas' => 'sometimes|integer|min:1',
            'deskripsi' => 'sometimes|string',
            'foto' => 'sometimes|nullable|string',
        ];
    }
}
