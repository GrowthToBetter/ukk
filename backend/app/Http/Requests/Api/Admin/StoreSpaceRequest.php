<?php

namespace App\Http\Requests\Api\Admin;

use Illuminate\Foundation\Http\FormRequest;

class StoreSpaceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'nama_space' => 'required|string|max:255',
            'harga_per_jam' => 'required|numeric|min:0',
            'tipe' => 'required|in:desk,meeting_room,private_office',
            'kapasitas' => 'required|integer|min:1',
            'deskripsi' => 'required|string',
            'foto' => 'sometimes|nullable|string',
        ];
    }
}
