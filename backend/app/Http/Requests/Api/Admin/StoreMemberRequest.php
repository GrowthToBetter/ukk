<?php

namespace App\Http\Requests\Api\Admin;

use Illuminate\Foundation\Http\FormRequest;

class StoreMemberRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'username' => 'required|string|unique:users,username,NULL,id,maker_id,'.$this->input('maker_id'),
            'password' => 'required|string|min:6',
            'nama_member' => 'required|string|max:255',
            'instansi' => 'required|string|max:255',
            'alamat' => 'required|string',
            'telp' => 'required|string|max:20',
        ];
    }
}
