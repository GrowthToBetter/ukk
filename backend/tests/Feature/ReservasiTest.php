<?php

use App\Models\Diskon;
use App\Models\Maker;
use App\Models\Member;
use App\Models\Reservasi;
use App\Models\Space;
use App\Models\SpaceOwner;
use App\Models\User;
use Carbon\Carbon;

/**
 * Setup lengkap untuk tes reservasi:
 * maker + owner + space + member + token member.
 */
function reservasiSetup(): array
{
    $maker = Maker::factory()->create();
    $header = ['x-maker-key' => $maker->app_key];

    $adminUser = User::factory()->for($maker)->adminSpace()->create();
    $owner = SpaceOwner::factory()->for($adminUser)->for($maker)->create();
    $space = Space::factory()->for($maker)->create([
        'id_owner' => $owner->id,
        'harga_per_jam' => 100000,
    ]);

    $memberUser = User::factory()->for($maker)->member()->create();
    $member = Member::factory()->for($memberUser)->for($maker)->create();
    $token = $memberUser->createToken('test')->plainTextToken;

    return compact('maker', 'header', 'adminUser', 'owner', 'space', 'memberUser', 'member', 'token');
}

/**
 * Helper: buat reservasi existing pada slot tertentu.
 */
function existingBooking(array $setup, string $tanggal, string $jamMulai, string $jamSelesai, string $status = 'belum_dikonfirm'): Reservasi
{
    $durasi = (int) Carbon::createFromFormat('H:i', $jamMulai)
        ->diffInHours(Carbon::createFromFormat('H:i', $jamSelesai));

    return Reservasi::factory()->create([
        'maker_id' => $setup['maker']->id,
        'id_space' => $setup['space']->id,
        'id_member' => $setup['member']->id,
        'tanggal_reservasi' => $tanggal,
        'jam_mulai' => $jamMulai,
        'jam_selesai' => $jamSelesai,
        'durasi_jam' => $durasi,
        'status' => $status,
    ]);
}

// ─── BASIC STORE ─────────────────────────────────────────────────────────────

test('reservasi: member dapat membuat reservasi baru', function () {
    $setup = reservasiSetup();
    $tanggal = now()->addDay()->format('Y-m-d');

    $response = $this->withHeaders($setup['header'])->withToken($setup['token'])
        ->postJson('/api/reservasi', [
            'id_space' => $setup['space']->id,
            'tanggal_reservasi' => $tanggal,
            'jam_mulai' => '09:00',
            'durasi_jam' => 2,
        ]);

    $response->assertCreated()
        ->assertJsonFragment(['status' => true])
        ->assertJsonStructure(['data' => ['id', 'kode_booking', 'member', 'space']]);

    $this->assertDatabaseHas('reservasi', [
        'id_space' => $setup['space']->id,
        'id_member' => $setup['member']->id,
        'status' => 'belum_dikonfirm',
    ]);
});

test('reservasi: kode_booking mengikuti format BOOK-YYYYMMDD-XXXX', function () {
    $setup = reservasiSetup();
    $tanggal = now()->addDay()->format('Y-m-d');

    $response = $this->withHeaders($setup['header'])->withToken($setup['token'])
        ->postJson('/api/reservasi', [
            'id_space' => $setup['space']->id,
            'tanggal_reservasi' => $tanggal,
            'jam_mulai' => '08:00',
            'durasi_jam' => 1,
        ]);

    $response->assertCreated();

    $kode = $response->json('data.kode_booking');
    expect($kode)->toMatch('/^BOOK-\d{8}-\d{4}$/');
});

test('reservasi: hanya member yang dapat membuat reservasi (admin_space ditolak)', function () {
    $setup = reservasiSetup();

    $adminToken = $setup['adminUser']->createToken('test')->plainTextToken;

    $response = $this->withHeaders($setup['header'])->withToken($adminToken)
        ->postJson('/api/reservasi', [
            'id_space' => $setup['space']->id,
            'tanggal_reservasi' => now()->addDay()->format('Y-m-d'),
            'jam_mulai' => '09:00',
            'durasi_jam' => 2,
        ]);

    $response->assertForbidden();
});

// ─── PERHITUNGAN HARGA ────────────────────────────────────────────────────────

test('reservasi: harga tanpa diskon = harga_per_jam * durasi_jam', function () {
    $setup = reservasiSetup();
    $tanggal = now()->addDay()->format('Y-m-d');

    // Space harga_per_jam = 100_000, durasi = 3 jam
    $response = $this->withHeaders($setup['header'])->withToken($setup['token'])
        ->postJson('/api/reservasi', [
            'id_space' => $setup['space']->id,
            'tanggal_reservasi' => $tanggal,
            'jam_mulai' => '09:00',
            'durasi_jam' => 3,
        ]);

    $response->assertCreated();

    expect($response->json('data.total_harga_awal'))->toBe(300000);
    expect($response->json('data.potongan_diskon'))->toBe(0);
    expect($response->json('data.total_bayar'))->toBe(300000);
});

test('reservasi: harga dengan diskon aktif 20% dihitung benar', function () {
    $setup = reservasiSetup();
    $tanggal = now()->addDay()->format('Y-m-d');

    $diskon = Diskon::factory()->active()->for($setup['maker'])->create([
        'nama_diskon' => 'PROMO20',
        'persentase_diskon' => '20.00',
    ]);

    // harga_per_jam=100000, durasi=3 → total_awal=300000, potongan=60000, bayar=240000
    $response = $this->withHeaders($setup['header'])->withToken($setup['token'])
        ->postJson('/api/reservasi', [
            'id_space' => $setup['space']->id,
            'tanggal_reservasi' => $tanggal,
            'jam_mulai' => '09:00',
            'durasi_jam' => 3,
            'kode_promo' => 'PROMO20',
        ]);

    $response->assertCreated();

    expect($response->json('data.total_harga_awal'))->toBe(300000);
    expect($response->json('data.potongan_diskon'))->toBe(60000);
    expect($response->json('data.total_bayar'))->toBe(240000);
});

test('reservasi: kode promo expired ditolak', function () {
    $setup = reservasiSetup();
    $tanggal = now()->addDay()->format('Y-m-d');

    Diskon::factory()->expired()->for($setup['maker'])->create(['nama_diskon' => 'PROMO-EXP']);

    $response = $this->withHeaders($setup['header'])->withToken($setup['token'])
        ->postJson('/api/reservasi', [
            'id_space' => $setup['space']->id,
            'tanggal_reservasi' => $tanggal,
            'jam_mulai' => '09:00',
            'durasi_jam' => 2,
            'kode_promo' => 'PROMO-EXP',
        ]);

    $response->assertStatus(400)
        ->assertJsonFragment(['status' => false]);
});

// ─── OVERLAP A: Existing 09:00-11:00, Request 09:00-11:00 (tepat sama) ──────

test('overlap A: slot yang identik ditolak', function () {
    $setup = reservasiSetup();
    $tanggal = now()->addDay()->format('Y-m-d');

    existingBooking($setup, $tanggal, '09:00', '11:00');

    $response = $this->withHeaders($setup['header'])->withToken($setup['token'])
        ->postJson('/api/reservasi', [
            'id_space' => $setup['space']->id,
            'tanggal_reservasi' => $tanggal,
            'jam_mulai' => '09:00',
            'durasi_jam' => 2, // 09:00–11:00
        ]);

    $response->assertStatus(400)
        ->assertJsonFragment(['status' => false]);
});

// ─── OVERLAP B: Existing 09:00-11:00, Request 08:00-10:00 (overlap di awal) ─

test('overlap B: request yang berakhir di tengah existing ditolak', function () {
    $setup = reservasiSetup();
    $tanggal = now()->addDay()->format('Y-m-d');

    existingBooking($setup, $tanggal, '09:00', '11:00');

    $response = $this->withHeaders($setup['header'])->withToken($setup['token'])
        ->postJson('/api/reservasi', [
            'id_space' => $setup['space']->id,
            'tanggal_reservasi' => $tanggal,
            'jam_mulai' => '08:00',
            'durasi_jam' => 2, // 08:00–10:00
        ]);

    $response->assertStatus(400)
        ->assertJsonFragment(['status' => false]);
});

// ─── OVERLAP C: Existing 09:00-11:00, Request 10:00-12:00 (overlap di akhir) ─

test('overlap C: request yang mulai di tengah existing ditolak', function () {
    $setup = reservasiSetup();
    $tanggal = now()->addDay()->format('Y-m-d');

    existingBooking($setup, $tanggal, '09:00', '11:00');

    $response = $this->withHeaders($setup['header'])->withToken($setup['token'])
        ->postJson('/api/reservasi', [
            'id_space' => $setup['space']->id,
            'tanggal_reservasi' => $tanggal,
            'jam_mulai' => '10:00',
            'durasi_jam' => 2, // 10:00–12:00
        ]);

    $response->assertStatus(400)
        ->assertJsonFragment(['status' => false]);
});

// ─── OVERLAP D: Existing 09:00-11:00, Request 08:00-12:00 (mencakup existing) ─

test('overlap D: request yang mencakup seluruh existing ditolak', function () {
    $setup = reservasiSetup();
    $tanggal = now()->addDay()->format('Y-m-d');

    existingBooking($setup, $tanggal, '09:00', '11:00');

    $response = $this->withHeaders($setup['header'])->withToken($setup['token'])
        ->postJson('/api/reservasi', [
            'id_space' => $setup['space']->id,
            'tanggal_reservasi' => $tanggal,
            'jam_mulai' => '08:00',
            'durasi_jam' => 4, // 08:00–12:00
        ]);

    $response->assertStatus(400)
        ->assertJsonFragment(['status' => false]);
});

// ─── BOUNDARY E: Existing 09:00-11:00, Request 11:00-13:00 (tepat setelah) ─

test('boundary E: request yang mulai tepat saat existing berakhir DIPERBOLEHKAN', function () {
    $setup = reservasiSetup();
    $tanggal = now()->addDay()->format('Y-m-d');

    existingBooking($setup, $tanggal, '09:00', '11:00');

    $response = $this->withHeaders($setup['header'])->withToken($setup['token'])
        ->postJson('/api/reservasi', [
            'id_space' => $setup['space']->id,
            'tanggal_reservasi' => $tanggal,
            'jam_mulai' => '11:00',
            'durasi_jam' => 2, // 11:00–13:00
        ]);

    $response->assertCreated()
        ->assertJsonFragment(['status' => true]);
});

// ─── BOUNDARY F: Existing 09:00-11:00, Request 07:00-09:00 (tepat sebelum) ─

test('boundary F: request yang berakhir tepat saat existing mulai DIPERBOLEHKAN', function () {
    $setup = reservasiSetup();
    $tanggal = now()->addDay()->format('Y-m-d');

    existingBooking($setup, $tanggal, '09:00', '11:00');

    $response = $this->withHeaders($setup['header'])->withToken($setup['token'])
        ->postJson('/api/reservasi', [
            'id_space' => $setup['space']->id,
            'tanggal_reservasi' => $tanggal,
            'jam_mulai' => '07:00',
            'durasi_jam' => 2, // 07:00–09:00
        ]);

    $response->assertCreated()
        ->assertJsonFragment(['status' => true]);
});

// ─── OVERLAP: dibatalkan tidak menghalangi ────────────────────────────────────

test('reservasi dibatalkan tidak menghalangi slot yang sama', function () {
    $setup = reservasiSetup();
    $tanggal = now()->addDay()->format('Y-m-d');

    existingBooking($setup, $tanggal, '09:00', '11:00', 'dibatalkan');

    $response = $this->withHeaders($setup['header'])->withToken($setup['token'])
        ->postJson('/api/reservasi', [
            'id_space' => $setup['space']->id,
            'tanggal_reservasi' => $tanggal,
            'jam_mulai' => '09:00',
            'durasi_jam' => 2,
        ]);

    $response->assertCreated()
        ->assertJsonFragment(['status' => true]);
});

// ─── TANGGAL BERBEDA: tidak ada overlap ────────────────────────────────────

test('reservasi di tanggal berbeda tidak conflict', function () {
    $setup = reservasiSetup();
    $tanggal1 = now()->addDay()->format('Y-m-d');
    $tanggal2 = now()->addDays(2)->format('Y-m-d');

    existingBooking($setup, $tanggal1, '09:00', '11:00');

    $response = $this->withHeaders($setup['header'])->withToken($setup['token'])
        ->postJson('/api/reservasi', [
            'id_space' => $setup['space']->id,
            'tanggal_reservasi' => $tanggal2,
            'jam_mulai' => '09:00',
            'durasi_jam' => 2,
        ]);

    $response->assertCreated()
        ->assertJsonFragment(['status' => true]);
});

// ─── STATUS FLOW ─────────────────────────────────────────────────────────────

test('reservasi: status awal adalah belum_dikonfirm', function () {
    $setup = reservasiSetup();
    $tanggal = now()->addDay()->format('Y-m-d');

    $response = $this->withHeaders($setup['header'])->withToken($setup['token'])
        ->postJson('/api/reservasi', [
            'id_space' => $setup['space']->id,
            'tanggal_reservasi' => $tanggal,
            'jam_mulai' => '09:00',
            'durasi_jam' => 2,
        ]);

    $response->assertCreated();
    expect($response->json('data.status'))->toBe('belum_dikonfirm');
});

// ─── CANCEL ───────────────────────────────────────────────────────────────────

test('cancel: member dapat membatalkan reservasi berstatus belum_dikonfirm', function () {
    $setup = reservasiSetup();

    $reservasi = Reservasi::factory()->create([
        'maker_id' => $setup['maker']->id,
        'id_space' => $setup['space']->id,
        'id_member' => $setup['member']->id,
        'status' => 'belum_dikonfirm',
    ]);

    $response = $this->withHeaders($setup['header'])->withToken($setup['token'])
        ->patchJson("/api/reservasi/{$reservasi->id}/cancel");

    $response->assertOk()
        ->assertJsonFragment(['status' => true])
        ->assertJsonPath('data.status', 'dibatalkan');
});

test('cancel: member dapat membatalkan reservasi berstatus disetujui', function () {
    $setup = reservasiSetup();

    $reservasi = Reservasi::factory()->create([
        'maker_id' => $setup['maker']->id,
        'id_space' => $setup['space']->id,
        'id_member' => $setup['member']->id,
        'status' => 'disetujui',
    ]);

    $response = $this->withHeaders($setup['header'])->withToken($setup['token'])
        ->patchJson("/api/reservasi/{$reservasi->id}/cancel");

    $response->assertOk()
        ->assertJsonPath('data.status', 'dibatalkan');
});

test('cancel: reservasi berstatus aktif tidak dapat dibatalkan', function () {
    $setup = reservasiSetup();

    $reservasi = Reservasi::factory()->create([
        'maker_id' => $setup['maker']->id,
        'id_space' => $setup['space']->id,
        'id_member' => $setup['member']->id,
        'status' => 'aktif',
        'check_in_time' => now(),
    ]);

    $response = $this->withHeaders($setup['header'])->withToken($setup['token'])
        ->patchJson("/api/reservasi/{$reservasi->id}/cancel");

    $response->assertStatus(400)
        ->assertJsonFragment(['status' => false]);
});

test('cancel: reservasi berstatus selesai tidak dapat dibatalkan', function () {
    $setup = reservasiSetup();

    $reservasi = Reservasi::factory()->create([
        'maker_id' => $setup['maker']->id,
        'id_space' => $setup['space']->id,
        'id_member' => $setup['member']->id,
        'status' => 'selesai',
        'check_in_time' => now()->subHours(3),
        'check_out_time' => now(),
    ]);

    $response = $this->withHeaders($setup['header'])->withToken($setup['token'])
        ->patchJson("/api/reservasi/{$reservasi->id}/cancel");

    $response->assertStatus(400)
        ->assertJsonFragment(['status' => false]);
});

test('cancel: reservasi yang sudah dibatalkan tidak dapat dibatalkan lagi', function () {
    $setup = reservasiSetup();

    $reservasi = Reservasi::factory()->create([
        'maker_id' => $setup['maker']->id,
        'id_space' => $setup['space']->id,
        'id_member' => $setup['member']->id,
        'status' => 'dibatalkan',
    ]);

    $response = $this->withHeaders($setup['header'])->withToken($setup['token'])
        ->patchJson("/api/reservasi/{$reservasi->id}/cancel");

    $response->assertStatus(400)
        ->assertJsonFragment(['status' => false]);
});

// ─── MY RESERVATIONS ──────────────────────────────────────────────────────────

test('reservasi: member hanya melihat reservasinya sendiri', function () {
    $setup = reservasiSetup();

    // Reservasi milik member ini
    Reservasi::factory()->count(3)->create([
        'maker_id' => $setup['maker']->id,
        'id_space' => $setup['space']->id,
        'id_member' => $setup['member']->id,
    ]);

    // Reservasi milik member lain
    $otherMemberUser = User::factory()->for($setup['maker'])->member()->create();
    $otherMember = Member::factory()->for($otherMemberUser)->for($setup['maker'])->create();
    Reservasi::factory()->count(2)->create([
        'maker_id' => $setup['maker']->id,
        'id_space' => $setup['space']->id,
        'id_member' => $otherMember->id,
    ]);

    $response = $this->withHeaders($setup['header'])->withToken($setup['token'])
        ->getJson('/api/reservasi/my');

    $response->assertOk();
    expect($response->json('data.total'))->toBe(3);
});

// ─── E-TICKET ─────────────────────────────────────────────────────────────────

test('reservasi: member pemilik dapat mengakses e-ticket', function () {
    $setup = reservasiSetup();

    $reservasi = Reservasi::factory()->create([
        'maker_id' => $setup['maker']->id,
        'id_space' => $setup['space']->id,
        'id_member' => $setup['member']->id,
        'status' => 'disetujui',
    ]);

    $response = $this->withHeaders($setup['header'])->withToken($setup['token'])
        ->getJson("/api/reservasi/{$reservasi->id}/e-ticket");

    $response->assertOk()
        ->assertJsonFragment(['status' => true])
        ->assertJsonStructure(['data' => ['kode_booking', 'qr_code_payload', 'member', 'space']]);
});
