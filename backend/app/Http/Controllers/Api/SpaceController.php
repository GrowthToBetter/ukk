<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Space;
use App\Services\ReservasiService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SpaceController extends Controller
{
    use ApiResponse;

    protected ReservasiService $reservasiService;

    public function __construct(ReservasiService $reservasiService)
    {
        $this->reservasiService = $reservasiService;
    }

    /**
     * Daftar tipe space statis.
     */
    public function types(): JsonResponse
    {
        $types = [
            [
                'value' => 'desk',
                'label' => 'Desk',
                'description' => 'Meja kerja individual untuk satu orang',
            ],
            [
                'value' => 'meeting_room',
                'label' => 'Meeting Room',
                'description' => 'Ruang meeting untuk kelompok kecil hingga sedang',
            ],
            [
                'value' => 'private_office',
                'label' => 'Private Office',
                'description' => 'Ruang kantor privat untuk tim atau perusahaan',
            ],
        ];

        return $this->success(['types' => $types], 'Daftar tipe space berhasil diambil');
    }

    /**
     * Check availability space per maker.
     */
    public function availability(Request $request): JsonResponse
    {
        $request->validate([
            'id_space' => ['required', 'integer', 'exists:spaces,id'],
            'tanggal' => ['required', 'date', 'after_or_equal:today'],
            'jam_mulai' => ['required', 'date_format:H:i'],
            'durasi_jam' => ['required', 'integer', 'min:1'],
        ]);

        $makerId = $request->integer('maker_id');

        // Pastikan space milik maker yg sama
        $space = Space::forMaker($makerId)->findOrFail($request->id_space);

        // Cek overlap reservasi menggunakan service
        $available = $this->reservasiService->cekKetersediaan(
            $request->id_space,
            $request->tanggal,
            $request->jam_mulai,
            $request->durasi_jam
        );

        return $this->success([
            'id_space' => $space->id,
            'nama_space' => $space->nama_space,
            'tanggal' => $request->tanggal,
            'jam_mulai' => $request->jam_mulai,
            'durasi_jam' => $request->durasi_jam,
            'available' => $available,
            'message' => $available ? 'Space tersedia' : 'Space tidak tersedia',
        ], 'Pengecekan ketersediaan berhasil');
    }

    /**
     * List semua space milik maker dengan filter.
     */
    public function index(Request $request): JsonResponse
    {
        $makerId = $request->integer('maker_id');

        $query = Space::forMaker($makerId)->with('owner');

        if ($request->filled('tipe')) {
            $query->byTipe($request->tipe);
        }

        if ($request->filled('search')) {
            $query->search($request->search);
        }

        $spaces = $query->orderBy('created_at', 'desc')->get();

        $data = $spaces->map(fn ($space) => [
            'id' => $space->id,
            'nama_space' => $space->nama_space,
            'harga_per_jam' => $space->harga_per_jam,
            'tipe' => $space->tipe,
            'kapasitas' => $space->kapasitas,
            'deskripsi' => $space->deskripsi,
            'foto' => $space->foto,
            'foto_url' => $space->foto_url,
            'owner' => [
                'id' => $space->owner->id,
                'nama_coworking' => $space->owner->nama_coworking,
                'nama_pemilik' => $space->owner->nama_pemilik,
                'telp' => $space->owner->telp,
            ],
            'created_at' => $space->created_at->toIso8601String(),
        ]);

        return $this->success([
            'spaces' => $data,
            'total' => $data->count(),
        ], 'Daftar space berhasil diambil');
    }

    /**
     * Detail space milik maker.
     */
    public function show(Request $request, int $id): JsonResponse
    {
        $makerId = $request->integer('maker_id');

        $space = Space::forMaker($makerId)->with('owner')->findOrFail($id);

        return $this->success([
            'id' => $space->id,
            'nama_space' => $space->nama_space,
            'harga_per_jam' => $space->harga_per_jam,
            'tipe' => $space->tipe,
            'kapasitas' => $space->kapasitas,
            'deskripsi' => $space->deskripsi,
            'foto' => $space->foto,
            'foto_url' => $space->foto_url,
            'owner' => [
                'id' => $space->owner->id,
                'nama_coworking' => $space->owner->nama_coworking,
                'nama_pemilik' => $space->owner->nama_pemilik,
                'telp' => $space->owner->telp,
            ],
            'created_at' => $space->created_at->toIso8601String(),
            'updated_at' => $space->updated_at->toIso8601String(),
        ], 'Detail space berhasil diambil');
    }
}
