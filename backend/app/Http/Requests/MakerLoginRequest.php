<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class MakerLoginRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'usernameOrEmail' => ['required', 'string'],
            'password' => ['required', 'string'],
        ];
    }

    public function messages(): array
    {
        return [
            'usernameOrEmail.required' => 'Username atau email wajib diisi',
            'password.required' => 'Password wajib diisi',
        ];
    }
}
