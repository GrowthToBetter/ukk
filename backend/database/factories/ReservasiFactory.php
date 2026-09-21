<?php

namespace Database\Factories;

use App\Models\Maker;
use App\Models\Member;
use App\Models\Reservasi;
use App\Models\Space;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Reservasi>
 */
class ReservasiFactory extends Factory
{
    protected $model = Reservasi::class;

    public function definition(): array
    {
        $durasi = fake()->numberBetween(1, 4);
        $jamMulai = fake()->randomElement(['08:00', '09:00', '10:00', '11:00', '13:00', '14:00']);
        $jamSelesai = Carbon::createFromFormat('H:i', $jamMulai)->addHours($durasi)->format('H:i');
        $hargaPerJam = 100000;
        $totalHargaAwal = $hargaPerJam * $durasi;

        return [
            'maker_id' => Maker::factory(),
            'kode_booking' => 'BOOK-'.now()->format('Ymd').'-'.fake()->unique()->numerify('####'),
            'id_member' => Member::factory(),
            'id_space' => Space::factory(),
            'id_diskon' => null,
            'tanggal_reservasi' => now()->addDay()->format('Y-m-d'),
            'jam_mulai' => $jamMulai,
            'jam_selesai' => $jamSelesai,
            'durasi_jam' => $durasi,
            'harga_per_jam' => $hargaPerJam,
            'total_harga_awal' => $totalHargaAwal,
            'potongan_diskon' => 0,
            'total_bayar' => $totalHargaAwal,
            'status' => 'belum_dikonfirm',
            'check_in_time' => null,
            'check_out_time' => null,
        ];
    }

    public function disetujui(): static
    {
        return $this->state(['status' => 'disetujui']);
    }

    public function aktif(): static
    {
        return $this->state([
            'status' => 'aktif',
            'check_in_time' => now(),
        ]);
    }

    public function selesai(): static
    {
        return $this->state([
            'status' => 'selesai',
            'check_in_time' => now()->subHours(3),
            'check_out_time' => now(),
        ]);
    }

    public function dibatalkan(): static
    {
        return $this->state(['status' => 'dibatalkan']);
    }
}
