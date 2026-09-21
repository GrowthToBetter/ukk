<?php

namespace App\Http\Requests\Api\Admin;

use Illuminate\Foundation\Http\FormRequest;

class UpdateMemberRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'nama_member' => 'sometimes|string|max:255',
            'instansi' => 'sometimes|string|max:255',
            'alamat' => 'sometimes|string',
            'telp' => 'sometimes|string|max:20',
            'foto' => 'sometimes|nullable|string|max:255',
        ];
    }
}
