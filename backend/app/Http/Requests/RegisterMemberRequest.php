<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class RegisterMemberRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'username' => ['required', 'string', 'max:255'],
            'password' => ['required', 'string', 'min:6'],
            'nama_member' => ['required', 'string', 'max:255'],
            'instansi' => ['required', 'string', 'max:255'],
            'alamat' => ['required', 'string'],
            'telp' => ['required', 'string', 'max:20'],
            'id_owner' => ['nullable', 'exists:space_owners,id'],
            'foto' => ['nullable', 'string', 'max:255'],
        ];
    }

    /**
     * Get custom messages for validator errors.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'username.required' => 'Username wajib diisi',
            'username.unique' => 'Username sudah digunakan',
            'password.required' => 'Password wajib diisi',
            'password.min' => 'Password minimal 6 karakter',
            'nama_member.required' => 'Nama member wajib diisi',
            'instansi.required' => 'Instansi wajib diisi',
            'alamat.required' => 'Alamat wajib diisi',
            'telp.required' => 'Nomor telepon wajib diisi',
        ];
    }
}
