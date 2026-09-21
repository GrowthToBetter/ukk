<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Diskon;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DiskonController extends Controller
{
    use ApiResponse;

    /**
     * List diskon aktif milik maker.
     */
    public function active(Request $request): JsonResponse
    {
        $makerId = $request->integer('maker_id');

        $diskons = Diskon::forMaker($makerId)->active()
            ->orderBy('tanggal_awal', 'desc')
            ->get();

        $data = $diskons->map(fn ($diskon) => [
            'id' => $diskon->id,
            'nama_diskon' => $diskon->nama_diskon,
            'persentase_diskon' => (float) $diskon->persentase_diskon,
            'tanggal_awal' => $diskon->tanggal_awal->toIso8601String(),
            'tanggal_akhir' => $diskon->tanggal_akhir->toIso8601String(),
            'is_active' => $diskon->is_active,
        ]);

        return $this->success([
            'diskons' => $data,
            'total' => $data->count(),
        ], 'Daftar diskon aktif berhasil diambil');
    }

    /**
     * Check diskon by nama_diskon milik maker.
     */
    public function check(Request $request): JsonResponse
    {
        $request->validate([
            'nama_diskon' => ['required', 'string'],
        ]);

        $makerId = $request->integer('maker_id');

        $diskon = Diskon::forMaker($makerId)
            ->where('nama_diskon', $request->nama_diskon)
            ->first();

        if (!$diskon) {
            return $this->error('Diskon tidak ditemukan', 404);
        }

        $isActive = $diskon->is_active;

        return $this->success([
            'id' => $diskon->id,
            'nama_diskon' => $diskon->nama_diskon,
            'persentase_diskon' => (float) $diskon->persentase_diskon,
            'tanggal_awal' => $diskon->tanggal_awal->toIso8601String(),
            'tanggal_akhir' => $diskon->tanggal_akhir->toIso8601String(),
            'is_active' => $isActive,
            'message' => $isActive ? 'Diskon valid dan dapat digunakan' : 'Diskon sudah kadaluarsa',
        ], $isActive ? 'Diskon valid' : 'Diskon tidak valid');
    }

    /**
     * Detail diskon milik maker.
     */
    public function show(Request $request, int $id): JsonResponse
    {
        $makerId = $request->integer('maker_id');

        $diskon = Diskon::forMaker($makerId)->findOrFail($id);

        return $this->success([
            'id' => $diskon->id,
            'nama_diskon' => $diskon->nama_diskon,
            'persentase_diskon' => (float) $diskon->persentase_diskon,
            'tanggal_awal' => $diskon->tanggal_awal->toIso8601String(),
            'tanggal_akhir' => $diskon->tanggal_akhir->toIso8601String(),
            'is_active' => $diskon->is_active,
            'created_at' => $diskon->created_at->toIso8601String(),
            'updated_at' => $diskon->updated_at->toIso8601String(),
        ], 'Detail diskon berhasil diambil');
    }
}
