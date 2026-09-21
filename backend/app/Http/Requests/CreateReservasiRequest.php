<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CreateReservasiRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'id_space' => ['required', 'integer', 'exists:spaces,id'],
            'tanggal_reservasi' => ['required', 'date', 'after_or_equal:today'],
            'jam_mulai' => ['required', 'date_format:H:i'],
            'durasi_jam' => ['required', 'integer', 'min:1'],
            'id_diskon' => ['nullable', 'integer', 'exists:diskon,id'],
            'kode_promo' => ['nullable', 'string'],
        ];
    }

    public function messages(): array
    {
        return [
            'id_space.required' => 'Space wajib dipilih',
            'id_space.exists' => 'Space tidak ditemukan',
            'tanggal_reservasi.required' => 'Tanggal reservasi wajib diisi',
            'tanggal_reservasi.after_or_equal' => 'Tanggal reservasi tidak boleh kurang dari hari ini',
            'jam_mulai.required' => 'Jam mulai wajib diisi',
            'jam_mulai.date_format' => 'Format jam mulai harus HH:mm',
            'durasi_jam.required' => 'Durasi jam wajib diisi',
            'durasi_jam.min' => 'Durasi minimal 1 jam',
            'id_diskon.exists' => 'Diskon tidak ditemukan',
        ];
    }
}
