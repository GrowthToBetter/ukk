<?php

namespace App\Http\Requests\Api\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreDiskonRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'nama_diskon' => [
                'required', 'string', 'max:255',
                Rule::unique('diskon')->where(fn ($query) => $query->where('id_owner', $this->user()->spaceOwner->id))
            ],
            'persentase_diskon' => 'required|numeric|between:1,100',
            'tanggal_awal' => 'required|date',
            'tanggal_akhir' => 'required|date|after:tanggal_awal',
        ];
    }
}
