<?php

use App\Models\Maker;
use App\Models\Member;
use App\Models\Reservasi;
use App\Models\Space;
use App\Models\SpaceOwner;
use App\Models\User;

/**
 * Setup lengkap: maker + admin user + space owner + space + member.
 */
function adminSetup(): array
{
    $maker = Maker::factory()->create();
    $header = ['x-maker-key' => $maker->app_key];

    $adminUser = User::factory()->for($maker)->adminSpace()->create();
    $owner = SpaceOwner::factory()->for($adminUser)->for($maker)->create();
    $adminToken = $adminUser->createToken('test')->plainTextToken;

    $space = Space::factory()->for($maker)->create(['id_owner' => $owner->id, 'harga_per_jam' => 100000]);

    $memberUser = User::factory()->for($maker)->member()->create();
    $member = Member::factory()->for($memberUser)->for($maker)->create();
    $memberToken = $memberUser->createToken('test')->plainTextToken;

    return compact(
        'maker', 'header',
        'adminUser', 'owner', 'adminToken',
        'space', 'memberUser', 'member', 'memberToken'
    );
}

// ─── ROLE GUARD: MEMBER TIDAK DAPAT AKSES ADMIN ENDPOINTS ───────────────────

test('admin: member ditolak mengakses /admin/profile', function () {
    $setup = adminSetup();

    $response = $this->withHeaders($setup['header'])->withToken($setup['memberToken'])
        ->getJson('/api/admin/profile');

    $response->assertForbidden()
        ->assertJsonFragment(['status' => false]);
});

test('admin: member ditolak mengakses /admin/members', function () {
    $setup = adminSetup();

    $response = $this->withHeaders($setup['header'])->withToken($setup['memberToken'])
        ->getJson('/api/admin/members');

    $response->assertForbidden()
        ->assertJsonFragment(['status' => false]);
});

test('admin: member ditolak mengakses /admin/spaces', function () {
    $setup = adminSetup();

    $response = $this->withHeaders($setup['header'])->withToken($setup['memberToken'])
        ->getJson('/api/admin/spaces');

    $response->assertForbidden()
        ->assertJsonFragment(['status' => false]);
});

test('admin: member ditolak mengakses /admin/diskon', function () {
    $setup = adminSetup();

    $response = $this->withHeaders($setup['header'])->withToken($setup['memberToken'])
        ->getJson('/api/admin/diskon');

    $response->assertForbidden()
        ->assertJsonFragment(['status' => false]);
});

test('admin: member ditolak mengakses /admin/reservasi', function () {
    $setup = adminSetup();

    $response = $this->withHeaders($setup['header'])->withToken($setup['memberToken'])
        ->getJson('/api/admin/reservasi');

    $response->assertForbidden()
        ->assertJsonFragment(['status' => false]);
});

// ─── ROLE GUARD: ADMIN TIDAK DAPAT AKSES MEMBER-ONLY ENDPOINTS ──────────────

test('admin: admin_space ditolak membuat reservasi (member-only)', function () {
    $setup = adminSetup();

    $response = $this->withHeaders($setup['header'])->withToken($setup['adminToken'])
        ->postJson('/api/reservasi', [
            'id_space' => $setup['space']->id,
            'tanggal_reservasi' => now()->addDay()->format('Y-m-d'),
            'jam_mulai' => '09:00',
            'durasi_jam' => 2,
        ]);

    $response->assertForbidden()
        ->assertJsonFragment(['status' => false]);
});

test('admin: admin_space ditolak melihat /reservasi/my (member-only)', function () {
    $setup = adminSetup();

    $response = $this->withHeaders($setup['header'])->withToken($setup['adminToken'])
        ->getJson('/api/reservasi/my');

    $response->assertForbidden()
        ->assertJsonFragment(['status' => false]);
});

// ─── ADMIN DAPAT MENGAKSES PROFIL ────────────────────────────────────────────

test('admin: admin_space dapat mengakses /admin/profile', function () {
    $setup = adminSetup();

    $response = $this->withHeaders($setup['header'])->withToken($setup['adminToken'])
        ->getJson('/api/admin/profile');

    $response->assertOk()
        ->assertJsonFragment(['status' => true]);
});

// ─── CHECK-IN: HANYA DARI STATUS DISETUJUI ───────────────────────────────────

test('admin: check-in berhasil dari status disetujui', function () {
    $setup = adminSetup();

    $reservasi = Reservasi::factory()->create([
        'maker_id' => $setup['maker']->id,
        'id_space' => $setup['space']->id,
        'id_member' => $setup['member']->id,
        'status' => 'disetujui',
    ]);

    $response = $this->withHeaders($setup['header'])->withToken($setup['adminToken'])
        ->postJson("/api/admin/reservasi/{$reservasi->id}/check-in");

    $response->assertOk()
        ->assertJsonFragment(['status' => true]);

    $this->assertDatabaseHas('reservasi', [
        'id' => $reservasi->id,
        'status' => 'aktif',
    ]);
});

test('admin: check-in ditolak dari status belum_dikonfirm', function () {
    $setup = adminSetup();

    $reservasi = Reservasi::factory()->create([
        'maker_id' => $setup['maker']->id,
        'id_space' => $setup['space']->id,
        'id_member' => $setup['member']->id,
        'status' => 'belum_dikonfirm',
    ]);

    $response = $this->withHeaders($setup['header'])->withToken($setup['adminToken'])
        ->postJson("/api/admin/reservasi/{$reservasi->id}/check-in");

    $response->assertStatus(400)
        ->assertJsonFragment(['status' => false]);
});

test('admin: check-in ditolak dari status aktif (sudah check-in)', function () {
    $setup = adminSetup();

    $reservasi = Reservasi::factory()->create([
        'maker_id' => $setup['maker']->id,
        'id_space' => $setup['space']->id,
        'id_member' => $setup['member']->id,
        'status' => 'aktif',
        'check_in_time' => now(),
    ]);

    $response = $this->withHeaders($setup['header'])->withToken($setup['adminToken'])
        ->postJson("/api/admin/reservasi/{$reservasi->id}/check-in");

    $response->assertStatus(400)
        ->assertJsonFragment(['status' => false]);
});

test('admin: check-in ditolak dari status selesai', function () {
    $setup = adminSetup();

    $reservasi = Reservasi::factory()->create([
        'maker_id' => $setup['maker']->id,
        'id_space' => $setup['space']->id,
        'id_member' => $setup['member']->id,
        'status' => 'selesai',
        'check_in_time' => now()->subHours(2),
        'check_out_time' => now(),
    ]);

    $response = $this->withHeaders($setup['header'])->withToken($setup['adminToken'])
        ->postJson("/api/admin/reservasi/{$reservasi->id}/check-in");

    $response->assertStatus(400)
        ->assertJsonFragment(['status' => false]);
});

test('admin: check-in ditolak dari status dibatalkan', function () {
    $setup = adminSetup();

    $reservasi = Reservasi::factory()->create([
        'maker_id' => $setup['maker']->id,
        'id_space' => $setup['space']->id,
        'id_member' => $setup['member']->id,
        'status' => 'dibatalkan',
    ]);

    $response = $this->withHeaders($setup['header'])->withToken($setup['adminToken'])
        ->postJson("/api/admin/reservasi/{$reservasi->id}/check-in");

    $response->assertStatus(400)
        ->assertJsonFragment(['status' => false]);
});

// ─── CHECK-OUT: HANYA DARI STATUS AKTIF ──────────────────────────────────────

test('admin: check-out berhasil dari status aktif', function () {
    $setup = adminSetup();

    $reservasi = Reservasi::factory()->create([
        'maker_id' => $setup['maker']->id,
        'id_space' => $setup['space']->id,
        'id_member' => $setup['member']->id,
        'status' => 'aktif',
        'check_in_time' => now()->subHour(),
    ]);

    $response = $this->withHeaders($setup['header'])->withToken($setup['adminToken'])
        ->postJson("/api/admin/reservasi/{$reservasi->id}/check-out");

    $response->assertOk()
        ->assertJsonFragment(['status' => true]);

    $this->assertDatabaseHas('reservasi', [
        'id' => $reservasi->id,
        'status' => 'selesai',
    ]);
});

test('admin: check-out ditolak dari status disetujui (belum check-in)', function () {
    $setup = adminSetup();

    $reservasi = Reservasi::factory()->create([
        'maker_id' => $setup['maker']->id,
        'id_space' => $setup['space']->id,
        'id_member' => $setup['member']->id,
        'status' => 'disetujui',
    ]);

    $response = $this->withHeaders($setup['header'])->withToken($setup['adminToken'])
        ->postJson("/api/admin/reservasi/{$reservasi->id}/check-out");

    $response->assertStatus(400)
        ->assertJsonFragment(['status' => false]);
});

test('admin: check-out ditolak dari status belum_dikonfirm', function () {
    $setup = adminSetup();

    $reservasi = Reservasi::factory()->create([
        'maker_id' => $setup['maker']->id,
        'id_space' => $setup['space']->id,
        'id_member' => $setup['member']->id,
        'status' => 'belum_dikonfirm',
    ]);

    $response = $this->withHeaders($setup['header'])->withToken($setup['adminToken'])
        ->postJson("/api/admin/reservasi/{$reservasi->id}/check-out");

    $response->assertStatus(400)
        ->assertJsonFragment(['status' => false]);
});

// ─── ADMIN: LIST RESERVASI DENGAN FILTER ─────────────────────────────────────

test('admin: dapat melihat daftar reservasi scoped per maker', function () {
    $setup = adminSetup();

    Reservasi::factory()->count(4)->create([
        'maker_id' => $setup['maker']->id,
        'id_space' => $setup['space']->id,
        'id_member' => $setup['member']->id,
    ]);

    // Reservasi maker lain
    $otherMaker = Maker::factory()->create();
    $otherAdminUser = User::factory()->for($otherMaker)->adminSpace()->create();
    $otherOwner = SpaceOwner::factory()->for($otherAdminUser)->for($otherMaker)->create();
    $otherSpace = Space::factory()->for($otherMaker)->create(['id_owner' => $otherOwner->id]);
    $otherMemberUser = User::factory()->for($otherMaker)->member()->create();
    $otherMember = Member::factory()->for($otherMemberUser)->for($otherMaker)->create();

    Reservasi::factory()->count(3)->create([
        'maker_id' => $otherMaker->id,
        'id_space' => $otherSpace->id,
        'id_member' => $otherMember->id,
    ]);

    $response = $this->withHeaders($setup['header'])->withToken($setup['adminToken'])
        ->getJson('/api/admin/reservasi');

    $response->assertOk()
        ->assertJsonFragment(['status' => true]);

    // Hanya 4 reservasi milik maker ini
    $data = $response->json('data');
    expect(count($data))->toBe(4);
});

// ─── ADMIN: UPDATE STATUS ─────────────────────────────────────────────────────

test('admin: dapat mengubah status reservasi ke disetujui', function () {
    $setup = adminSetup();

    $reservasi = Reservasi::factory()->create([
        'maker_id' => $setup['maker']->id,
        'id_space' => $setup['space']->id,
        'id_member' => $setup['member']->id,
        'status' => 'belum_dikonfirm',
    ]);

    $response = $this->withHeaders($setup['header'])->withToken($setup['adminToken'])
        ->patchJson("/api/admin/reservasi/{$reservasi->id}/status", [
            'status' => 'disetujui',
        ]);

    $response->assertOk()
        ->assertJsonFragment(['status' => true]);

    $this->assertDatabaseHas('reservasi', [
        'id' => $reservasi->id,
        'status' => 'disetujui',
    ]);
});

// ─── TANPA TOKEN: ENDPOINT ADMIN DITOLAK ────────────────────────────────────

test('admin: endpoint admin tanpa token mengembalikan 401', function () {
    ['header' => $header] = adminSetup();

    $response = $this->withHeaders($header)->getJson('/api/admin/profile');

    $response->assertUnauthorized();
});
