<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Reservasi;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReportController extends Controller
{
    use ApiResponse;

    public function monthly(Request $request): JsonResponse
    {
        $owner = $request->user()->spaceOwner;
        $query = Reservasi::whereHas('space', fn($q) => $q->where('id_owner', $owner->id))->whereIn('status', ['disetujui', 'aktif', 'selesai']);

        if ($request->filled('month')) {
            $query->whereMonth('tanggal_reservasi', $request->month);
        }
        if ($request->filled('year')) {
            $query->whereYear('tanggal_reservasi', $request->year);
        }

        $reservations = $query->with('space')->get();

        $dailyData = $reservations->groupBy(fn ($r) => $r->tanggal_reservasi->format('Y-m-d'))
            ->map(fn ($group, $date) => [
                'day' => $date,
                'total' => $group->sum('total_bayar')
            ])->values();

        $breakdown = [
            'desk' => $reservations->where('space.tipe', 'desk')->sum('total_bayar'),
            'meeting_room' => $reservations->where('space.tipe', 'meeting_room')->sum('total_bayar'),
            'private_office' => $reservations->where('space.tipe', 'private_office')->sum('total_bayar'),
        ];

        return $this->success([
            'total_pendapatan' => $reservations->sum('total_bayar'),
            'breakdown' => $breakdown,
            'daily_data' => $dailyData
        ], 'Laporan bulanan berhasil diambil');
    }

    public function income(Request $request): JsonResponse
    {
        $owner = $request->user()->spaceOwner;
        $query = Reservasi::whereHas('space', fn($q) => $q->where('id_owner', $owner->id))->whereIn('status', ['disetujui', 'aktif', 'selesai']);

        if ($request->filled('month')) {
            $query->whereMonth('tanggal_reservasi', $request->month);
        }
        if ($request->filled('year')) {
            $query->whereYear('tanggal_reservasi', $request->year);
        }

        $income = $query->sum('total_bayar');

        return $this->success([
            'total_pendapatan' => $income,
            'breakdown' => [
                'desk' => 0, 
                'meeting_room' => 0,
                'private_office' => 0
            ],
            'daily_data' => []
        ], 'Laporan pendapatan berhasil diambil');
    }
}
