<?php

namespace App\Services;

use App\Models\Diskon;
use App\Models\Reservasi;
use App\Models\Space;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class ReservasiService
{
    /**
     * Cek ketersediaan space pada tanggal dan jam tertentu.
     * Return true jika tersedia, false jika bentrok.
     */
    public function cekKetersediaan(int $idSpace, string $tanggal, string $jamMulai, int $durasiJam): bool
    {
        // Hitung jam_selesai dengan format H:i agar konsisten dengan data di DB (SQLite menyimpan sebagai text H:i)
        // PENTING: gunakan H:i (bukan H:i:s) — boundary check strict less than (<) akan benar
        // karena "10:00" < "10:00" = false, sedangkan "10:00" < "10:00:00" = true (string bug di SQLite)
        $jamSelesai = Carbon::createFromFormat('H:i', $jamMulai)
            ->addHours($durasiJam)
            ->format('H:i');
            
        $jamMulaiFormatted = Carbon::createFromFormat('H:i', $jamMulai)->format('H:i');

        // Cari reservasi yang bentrok:
        // - Space yang sama
        // - Tanggal yang sama
        // - Status BUKAN dibatalkan
        // - Jam overlap: jam_mulai_baru < jam_selesai_existing AND jam_mulai_existing < jam_selesai_baru
        $bentrok = Reservasi::where('id_space', $idSpace)
            ->whereDate('tanggal_reservasi', $tanggal)
            ->where('status', '!=', 'dibatalkan')
            ->where(function ($query) use ($jamMulaiFormatted, $jamSelesai) {
                $query->whereRaw("strftime('%H:%M', jam_mulai) < ?", [$jamSelesai])
                      ->whereRaw("strftime('%H:%M', jam_selesai) > ?", [$jamMulaiFormatted]);
            })
            ->exists();

        return !$bentrok;
    }

    /**
     * Hitung total harga reservasi dengan/tanpa diskon.
     * Return array: ['total_harga_awal', 'potongan_diskon', 'total_bayar']
     */
    public function hitungHarga(Space $space, int $durasiJam, ?Diskon $diskon = null): array
    {
        $hargaPerJam = $space->harga_per_jam;
        $totalHargaAwal = $hargaPerJam * $durasiJam;
        $potonganDiskon = 0;

        if ($diskon && $diskon->is_active) {
            $potonganDiskon = (int) floor($totalHargaAwal * ($diskon->persentase_diskon / 100));
        }

        $totalBayar = $totalHargaAwal - $potonganDiskon;

        return [
            'total_harga_awal' => $totalHargaAwal,
            'potongan_diskon' => $potonganDiskon,
            'total_bayar' => $totalBayar,
        ];
    }

    /**
     * Generate kode booking format: BOOK-YYYYMMDD-XXXX
     * XXXX = 4 digit id reservasi (zero-padded)
     */
    public function generateKodeBooking(string $tanggal, int $reservasiId): string
    {
        $tanggalFormat = Carbon::parse($tanggal)->format('Ymd');
        $idPadded = str_pad($reservasiId, 4, '0', STR_PAD_LEFT);

        return "BOOK-{$tanggalFormat}-{$idPadded}";
    }

    /**
     * Hitung jam_selesai dari jam_mulai + durasi_jam.
     */
    public function hitungJamSelesai(string $jamMulai, int $durasiJam): string
    {
        return Carbon::createFromFormat('H:i', $jamMulai)
            ->addHours($durasiJam)
            ->format('H:i');
    }
}
