<?php

namespace App\Http\Requests\Api\Admin;

use Illuminate\Foundation\Http\FormRequest;

class UpdateProfileRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'nama_coworking' => 'required|string|max:255',
            'nama_pemilik' => 'required|string|max:255',
            'telp' => 'required|string|max:20',
        ];
    }
}
