<?php

namespace Database\Seeders;

use App\Models\Diskon;
use App\Models\Maker;
use App\Models\Member;
use App\Models\Reservasi;
use App\Models\Space;
use App\Models\SpaceOwner;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $faker = \Faker\Factory::create('id_ID');

        // 1. 1 Maker
        $maker = Maker::create([
            'name' => 'UKK Development Maker',
            'username' => 'maker_dev',
            'email' => 'dev@maker.com',
            'password' => Hash::make('password'),
            'app_key' => 'mk_dev_default_key_ukk2026',
        ]);

        // 2. 1 User admin_space + 1 SpaceOwner
        $adminUser = User::create([
            'maker_id' => $maker->id,
            'username' => 'admin_space_01',
            'password' => Hash::make('password'),
            'role' => 'admin_space',
        ]);

        $owner = SpaceOwner::create([
            'user_id' => $adminUser->id,
            'maker_id' => $maker->id,
            'nama_coworking' => 'Smart Space Central',
            'nama_pemilik' => 'Pemilik Utama',
            'telp' => '081234567890',
        ]);

        // 3. 20 Member (1 manual + 19 Faker)
        $members = collect();

        // Manual
        $mUser = User::create([
            'maker_id' => $maker->id,
            'username' => 'member_manual',
            'password' => Hash::make('password'),
            'role' => 'member',
        ]);
        $members->push(Member::create([
            'user_id' => $mUser->id,
            'maker_id' => $maker->id,
            'nama_member' => 'Member Manual',
            'instansi' => 'Instansi Manual',
            'alamat' => 'Alamat Manual',
            'telp' => '081111111111',
        ]));

        // Faker
        for ($i = 0; $i < 19; $i++) {
            // Unik username per maker
            $username = 'member_' . $i . Str::random(5);
            $u = User::create([
                'maker_id' => $maker->id,
                'username' => $username,
                'password' => Hash::make('password'),
                'role' => 'member',
            ]);
            $members->push(Member::create([
                'user_id' => $u->id,
                'maker_id' => $maker->id,
                'nama_member' => $faker->name(),
                'instansi' => $faker->company(),
                'alamat' => $faker->address(),
                'telp' => $faker->phoneNumber(),
            ]));
        }

        // 4. 8 Space
        $spaces = collect();
        $tipeSpaces = ['desk', 'meeting_room', 'private_office'];
        for ($i = 0; $i < 8; $i++) {
            $spaces->push(Space::create([
                'maker_id' => $maker->id,
                'id_owner' => $owner->id,
                'nama_space' => 'Space ' . $i . ' ' . Str::random(3),
                'harga_per_jam' => rand(10, 100) * 1000,
                'tipe' => $tipeSpaces[array_rand($tipeSpaces)],
                'kapasitas' => rand(1, 20),
                'deskripsi' => $faker->sentence(),
            ]));
        }

        // 5. 3 Diskon (2 aktif, 1 expired)
        $diskon1 = Diskon::create([
            'maker_id' => $maker->id,
            'id_owner' => $owner->id,
            'nama_diskon' => 'DISKON_AKTIF_1',
            'persentase_diskon' => 10,
            'tanggal_awal' => Carbon::now()->subDays(10),
            'tanggal_akhir' => Carbon::now()->addDays(10),
        ]);
        $diskon2 = Diskon::create([
            'maker_id' => $maker->id,
            'id_owner' => $owner->id,
            'nama_diskon' => 'DISKON_AKTIF_2',
            'persentase_diskon' => 20,
            'tanggal_awal' => Carbon::now()->subDays(5),
            'tanggal_akhir' => Carbon::now()->addDays(20),
        ]);
        Diskon::create([
            'maker_id' => $maker->id,
            'id_owner' => $owner->id,
            'nama_diskon' => 'DISKON_EXPIRED',
            'persentase_diskon' => 50,
            'tanggal_awal' => Carbon::now()->subDays(30),
            'tanggal_akhir' => Carbon::now()->subDays(10),
        ]);
        $diskonAktif = collect([$diskon1, $diskon2]);

        // 6. 150 Reservasi
        for ($i = 0; $i < 150; $i++) {
            $member = $members->random();
            $space = $spaces->random();
            $tanggal = Carbon::now()->addDays(rand(-30, 30));
            $jamMulai = rand(8, 18);
            $durasi = rand(1, 4);
            $jamSelesai = $jamMulai + $durasi;

            // Enum: ['belum_dikonfirm', 'disetujui', 'aktif', 'selesai', 'dibatalkan']
            $status = 'belum_dikonfirm';
            if ($tanggal->isPast()) {
                $status = $faker->randomElement(['selesai', 'dibatalkan']);
            } elseif ($tanggal->isToday()) {
                $status = $faker->randomElement(['disetujui', 'aktif']);
            } else {
                $status = $faker->randomElement(['belum_dikonfirm', 'disetujui']);
            }

            $diskon = $faker->boolean(40) ? $diskonAktif->random() : null;
            $potongan = $diskon ? ($space->harga_per_jam * $durasi) * ($diskon->persentase_diskon / 100) : 0;
            $totalHargaAwal = $space->harga_per_jam * $durasi;

            $res = Reservasi::create([
                'maker_id' => $maker->id,
                'kode_booking' => 'TEMP',
                'id_member' => $member->id,
                'id_space' => $space->id,
                'id_diskon' => $diskon?->id,
                'tanggal_reservasi' => $tanggal->format('Y-m-d'),
                'jam_mulai' => $jamMulai . ':00',
                'jam_selesai' => $jamSelesai . ':00',
                'durasi_jam' => $durasi,
                'harga_per_jam' => $space->harga_per_jam,
                'total_harga_awal' => $totalHargaAwal,
                'potongan_diskon' => $potongan,
                'total_bayar' => $totalHargaAwal - $potongan,
                'status' => $status,
                'check_in_time' => ($status === 'selesai' || $status === 'aktif') ? $tanggal->copy()->setTime(rand(8,18), 0) : null,
                'check_out_time' => ($status === 'selesai') ? $tanggal->copy()->setTime(rand(8,18), 0) : null,
            ]);

            $res->update([
                'kode_booking' => 'BOOK-' . $tanggal->format('Ymd') . '-' . str_pad($res->id, 4, '0', STR_PAD_LEFT),
            ]);
        }
    }
}
