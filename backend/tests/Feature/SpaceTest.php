<?php

use App\Models\Maker;
use App\Models\Member;
use App\Models\Reservasi;
use App\Models\Space;
use App\Models\SpaceOwner;
use App\Models\User;

/**
 * Setup lengkap: maker + admin + space.
 */
function setupMakerWithSpace(): array
{
    $maker = Maker::factory()->create();
    $header = ['x-maker-key' => $maker->app_key];

    $adminUser = User::factory()->for($maker)->adminSpace()->create();
    $owner = SpaceOwner::factory()->for($adminUser)->for($maker)->create();
    $space = Space::factory()->for($maker)->create(['id_owner' => $owner->id]);

    return compact('maker', 'header', 'adminUser', 'owner', 'space');
}

// ─── LIST SPACE ─────────────────────────────────────────────────────────────

test('space: list returns spaces scoped to maker', function () {
    ['maker' => $maker, 'header' => $header, 'owner' => $owner] = setupMakerWithSpace();

    // Tambah 2 space lagi untuk maker yang sama
    Space::factory()->count(2)->for($maker)->create(['id_owner' => $owner->id]);

    // Maker lain punya space terpisah
    $otherMaker = Maker::factory()->create();
    $otherUser = User::factory()->for($otherMaker)->adminSpace()->create();
    $otherOwner = SpaceOwner::factory()->for($otherUser)->for($otherMaker)->create();
    Space::factory()->for($otherMaker)->create(['id_owner' => $otherOwner->id]);

    $response = $this->withHeaders($header)->getJson('/api/spaces');

    $response->assertOk()
        ->assertJsonFragment(['status' => true])
        ->assertJsonStructure(['data' => ['spaces', 'total']]);

    // Hanya dapat space milik maker ini (3 space)
    expect($response->json('data.total'))->toBe(3);
});

test('space: list can filter by tipe', function () {
    ['maker' => $maker, 'header' => $header, 'owner' => $owner] = setupMakerWithSpace();

    Space::factory()->for($maker)->create(['id_owner' => $owner->id, 'tipe' => 'desk']);
    Space::factory()->for($maker)->create(['id_owner' => $owner->id, 'tipe' => 'meeting_room']);
    Space::factory()->for($maker)->create(['id_owner' => $owner->id, 'tipe' => 'desk']);

    $response = $this->withHeaders($header)->getJson('/api/spaces?tipe=desk');

    $response->assertOk();

    // Semua result harus bertipe desk
    $spaces = $response->json('data.spaces');
    foreach ($spaces as $space) {
        expect($space['tipe'])->toBe('desk');
    }
});

test('space: list can search by name', function () {
    ['maker' => $maker, 'header' => $header, 'owner' => $owner] = setupMakerWithSpace();

    Space::factory()->for($maker)->create([
        'id_owner' => $owner->id,
        'nama_space' => 'Creative Hub Alpha',
    ]);
    Space::factory()->for($maker)->create([
        'id_owner' => $owner->id,
        'nama_space' => 'Quantum Room Beta',
    ]);

    $response = $this->withHeaders($header)->getJson('/api/spaces?search=Creative');

    $response->assertOk();

    $spaces = $response->json('data.spaces');
    expect(count($spaces))->toBe(1);
    expect($spaces[0]['nama_space'])->toContain('Creative');
});

// ─── DETAIL SPACE ────────────────────────────────────────────────────────────

test('space: detail returns correct space', function () {
    ['header' => $header, 'space' => $space] = setupMakerWithSpace();

    $response = $this->withHeaders($header)->getJson("/api/spaces/{$space->id}");

    $response->assertOk()
        ->assertJsonFragment(['status' => true])
        ->assertJsonFragment(['nama_space' => $space->nama_space]);
});

test('space: detail returns 404 for space of different maker', function () {
    ['header' => $header] = setupMakerWithSpace();

    // Space milik maker lain
    $otherMaker = Maker::factory()->create();
    $otherUser = User::factory()->for($otherMaker)->adminSpace()->create();
    $otherOwner = SpaceOwner::factory()->for($otherUser)->for($otherMaker)->create();
    $otherSpace = Space::factory()->for($otherMaker)->create(['id_owner' => $otherOwner->id]);

    $response = $this->withHeaders($header)->getJson("/api/spaces/{$otherSpace->id}");

    $response->assertNotFound();
});

// ─── TYPES ───────────────────────────────────────────────────────────────────

test('space: types returns 3 static types', function () {
    ['header' => $header] = setupMakerWithSpace();

    $response = $this->withHeaders($header)->getJson('/api/spaces/types');

    $response->assertOk()
        ->assertJsonFragment(['status' => true]);

    $types = $response->json('data.types');
    expect(count($types))->toBe(3);

    $values = array_column($types, 'value');
    expect($values)->toContain('desk')
        ->toContain('meeting_room')
        ->toContain('private_office');
});

// ─── AVAILABILITY CHECK ──────────────────────────────────────────────────────

test('space: availability returns true when no bookings exist', function () {
    ['maker' => $maker, 'header' => $header, 'space' => $space] = setupMakerWithSpace();

    $tanggal = now()->addDay()->format('Y-m-d');

    $response = $this->withHeaders($header)->getJson(
        "/api/spaces/availability?id_space={$space->id}&tanggal={$tanggal}&jam_mulai=09:00&durasi_jam=2"
    );

    $response->assertOk()
        ->assertJsonFragment(['available' => true]);
});

test('space: availability returns false when slot occupied', function () {
    ['maker' => $maker, 'header' => $header, 'owner' => $owner, 'space' => $space] = setupMakerWithSpace();

    $memberUser = User::factory()->for($maker)->member()->create();
    $member = Member::factory()->for($memberUser)->for($maker)->create();

    $tanggal = now()->addDay()->format('Y-m-d');

    // Existing reservation: 09:00–11:00
    Reservasi::factory()->create([
        'maker_id' => $maker->id,
        'id_space' => $space->id,
        'id_member' => $member->id,
        'tanggal_reservasi' => $tanggal,
        'jam_mulai' => '09:00',
        'jam_selesai' => '11:00',
        'durasi_jam' => 2,
        'status' => 'belum_dikonfirm',
    ]);

    // Request untuk slot yang overlap: 10:00–12:00
    $response = $this->withHeaders($header)->getJson(
        "/api/spaces/availability?id_space={$space->id}&tanggal={$tanggal}&jam_mulai=10:00&durasi_jam=2"
    );

    $response->assertOk()
        ->assertJsonFragment(['available' => false]);
});

test('space: availability returns true for past date is rejected (validation)', function () {
    ['header' => $header, 'space' => $space] = setupMakerWithSpace();

    $yesterday = now()->subDay()->format('Y-m-d');

    $response = $this->withHeaders($header)->getJson(
        "/api/spaces/availability?id_space={$space->id}&tanggal={$yesterday}&jam_mulai=09:00&durasi_jam=2"
    );

    // Validasi menolak tanggal masa lalu
    $response->assertUnprocessable();
});

test('space: availability requires x-maker-key header', function () {
    $response = $this->getJson('/api/spaces/availability?id_space=1&tanggal=2030-01-01&jam_mulai=09:00&durasi_jam=1');

    $response->assertStatus(400);
});
