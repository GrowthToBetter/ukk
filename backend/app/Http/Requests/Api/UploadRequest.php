<?php

namespace App\Http\Requests\Api;

use Illuminate\Foundation\Http\FormRequest;

class UploadRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'file' => ['required', 'file', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'file.required' => 'File wajib disertakan',
            'file.file' => 'Upload harus berupa file',
            'file.mimes' => 'Tipe file tidak diizinkan. Gunakan: jpg, jpeg, png, atau webp',
            'file.max' => 'Ukuran file tidak boleh melebihi 2MB',
        ];
    }
}
