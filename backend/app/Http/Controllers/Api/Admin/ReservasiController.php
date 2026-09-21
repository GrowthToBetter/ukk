<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\Admin\UpdateReservasiStatusRequest;
use App\Models\Reservasi;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReservasiController extends Controller
{
    use ApiResponse;

    public function index(Request $request): JsonResponse
    {
        $owner = $request->user()->spaceOwner;
        $query = Reservasi::whereHas('space', fn($q) => $q->where('id_owner', $owner->id))->with(['member', 'space']);

        if ($request->filled('month')) {
            $query->whereMonth('tanggal_reservasi', $request->month);
        }
        if ($request->filled('year')) {
            $query->whereYear('tanggal_reservasi', $request->year);
        }
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }
        if ($request->filled('id_space')) {
            $query->where('id_space', $request->id_space);
        }
        if ($request->filled('tanggal_awal')) {
            $query->where('tanggal_reservasi', '>=', $request->tanggal_awal);
        }
        if ($request->filled('tanggal_akhir')) {
            $query->where('tanggal_reservasi', '<=', $request->tanggal_akhir);
        }

        return $this->success($query->get(), 'Daftar reservasi berhasil diambil');
    }

    public function updateStatus(UpdateReservasiStatusRequest $request, int $id): JsonResponse
    {
        $owner = $request->user()->spaceOwner;
        $reservasi = Reservasi::whereHas('space', fn($q) => $q->where('id_owner', $owner->id))->findOrFail($id);

        if ($request->status === 'disetujui' && !$reservasi->bukti_bayar) {
            return $this->error('Bukti pembayaran belum diupload', 422);
        }

        $reservasi->update(['status' => $request->status]);

        return $this->success($reservasi, 'Status reservasi berhasil diperbarui');
    }

    public function checkIn(Request $request, int $id): JsonResponse
    {
        $owner = $request->user()->spaceOwner;
        $reservasi = Reservasi::whereHas('space', fn($q) => $q->where('id_owner', $owner->id))->findOrFail($id);

        if ($reservasi->status !== 'disetujui') {
            return $this->error('Check-in hanya valid untuk status disetujui', 400);
        }

        $reservasi->update([
            'status' => 'aktif', 
            'check_in_time' => now(),
            'is_claimed' => true,
            'claimed_at' => now(),
        ]);

        return $this->success($reservasi, 'Check-in berhasil');
    }

    public function checkOut(Request $request, int $id): JsonResponse
    {
        $owner = $request->user()->spaceOwner;
        $reservasi = Reservasi::whereHas('space', fn($q) => $q->where('id_owner', $owner->id))->findOrFail($id);

        if ($reservasi->status !== 'aktif') {
            return $this->error('Check-out hanya valid untuk status aktif', 400);
        }

        $reservasi->update(['status' => 'selesai', 'check_out_time' => now()]);

        return $this->success($reservasi, 'Check-out berhasil');
    }
}
