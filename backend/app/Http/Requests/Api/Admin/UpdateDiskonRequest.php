<?php

namespace App\Http\Requests\Api\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateDiskonRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'nama_diskon' => [
                'sometimes', 'string', 'max:255',
                Rule::unique('diskon')->ignore($this->route('id'))->where(fn ($query) => $query->where('id_owner', $this->user()->spaceOwner->id))
            ],
            'persentase_diskon' => 'sometimes|numeric|between:1,100',
            'tanggal_awal' => 'sometimes|date',
            'tanggal_akhir' => 'sometimes|date|after:tanggal_awal',
        ];
    }
}
