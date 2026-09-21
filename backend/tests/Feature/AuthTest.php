<?php

use App\Models\Maker;
use App\Models\Member;
use App\Models\SpaceOwner;
use App\Models\User;

/**
 * Helper: buat maker + return header x-maker-key.
 */
function makerWithHeader(): array
{
    $maker = Maker::factory()->create();

    return [
        'maker' => $maker,
        'header' => ['x-maker-key' => $maker->app_key],
    ];
}

// ─── REGISTER MEMBER ────────────────────────────────────────────────────────

test('auth: member can register', function () {
    ['maker' => $maker, 'header' => $header] = makerWithHeader();

    $response = $this->withHeaders($header)->postJson('/api/auth/register/member', [
        'username' => 'newmember',
        'password' => 'password123',
        'nama_member' => 'Budi Santoso',
        'instansi' => 'Universitas X',
        'alamat' => 'Jl. Test No. 1',
        'telp' => '081234567890',
    ]);

    $response->assertCreated()
        ->assertJsonFragment(['status' => true])
        ->assertJsonStructure(['data' => ['user', 'member', 'access_token']]);

    $this->assertDatabaseHas('users', [
        'maker_id' => $maker->id,
        'username' => 'newmember',
        'role' => 'member',
    ]);
});

test('auth: member register rejected with duplicate username within same maker', function () {
    ['maker' => $maker, 'header' => $header] = makerWithHeader();

    // Buat user pertama
    $user = User::factory()->for($maker)->member()->create(['username' => 'dupeuser']);
    Member::factory()->for($user)->for($maker)->create();

    $response = $this->withHeaders($header)->postJson('/api/auth/register/member', [
        'username' => 'dupeuser',
        'password' => 'password123',
        'nama_member' => 'Someone Else',
        'instansi' => 'Company Y',
        'alamat' => 'Jl. Y',
        'telp' => '089876543210',
    ]);

    $response->assertStatus(409)
        ->assertJsonFragment(['status' => false]);
});

test('auth: same username is allowed in different makers', function () {
    ['maker' => $maker1, 'header' => $header1] = makerWithHeader();
    ['maker' => $maker2, 'header' => $header2] = makerWithHeader();

    // Register di maker1
    $this->withHeaders($header1)->postJson('/api/auth/register/member', [
        'username' => 'sharedname',
        'password' => 'password123',
        'nama_member' => 'User A',
        'instansi' => 'Company A',
        'alamat' => 'Jl. A',
        'telp' => '081111111111',
    ])->assertCreated();

    // Register di maker2 dengan username sama — harus boleh
    $this->withHeaders($header2)->postJson('/api/auth/register/member', [
        'username' => 'sharedname',
        'password' => 'password123',
        'nama_member' => 'User B',
        'instansi' => 'Company B',
        'alamat' => 'Jl. B',
        'telp' => '082222222222',
    ])->assertCreated();
});

// ─── REGISTER ADMIN SPACE ────────────────────────────────────────────────────

test('auth: admin-space can register', function () {
    ['maker' => $maker, 'header' => $header] = makerWithHeader();

    $response = $this->withHeaders($header)->postJson('/api/auth/register/admin-space', [
        'username' => 'adminspace1',
        'password' => 'password123',
        'nama_coworking' => 'Coworking Test',
        'nama_pemilik' => 'Pak Admin',
        'telp' => '083333333333',
    ]);

    $response->assertCreated()
        ->assertJsonFragment(['status' => true])
        ->assertJsonStructure(['data' => ['user', 'space_owner', 'access_token']]);

    $this->assertDatabaseHas('users', [
        'maker_id' => $maker->id,
        'username' => 'adminspace1',
        'role' => 'admin_space',
    ]);
});

test('auth: admin-space register rejected with duplicate username within same maker', function () {
    ['maker' => $maker, 'header' => $header] = makerWithHeader();

    $user = User::factory()->for($maker)->adminSpace()->create(['username' => 'takenAdmin']);
    SpaceOwner::factory()->for($user)->for($maker)->create();

    $response = $this->withHeaders($header)->postJson('/api/auth/register/admin-space', [
        'username' => 'takenAdmin',
        'password' => 'password123',
        'nama_coworking' => 'Another Coworking',
        'nama_pemilik' => 'Somebody',
        'telp' => '084444444444',
    ]);

    $response->assertStatus(409)
        ->assertJsonFragment(['status' => false]);
});

// ─── LOGIN ───────────────────────────────────────────────────────────────────

test('auth: member can login within correct maker scope', function () {
    ['maker' => $maker, 'header' => $header] = makerWithHeader();

    $user = User::factory()->for($maker)->member()->create(['username' => 'memberlogin', 'password' => 'pass123']);
    Member::factory()->for($user)->for($maker)->create();

    $response = $this->withHeaders($header)->postJson('/api/auth/login', [
        'username' => 'memberlogin',
        'password' => 'pass123',
    ]);

    $response->assertOk()
        ->assertJsonFragment(['status' => true])
        ->assertJsonStructure(['data' => ['user', 'member', 'access_token']]);
});

test('auth: admin-space can login and gets space_owner data', function () {
    ['maker' => $maker, 'header' => $header] = makerWithHeader();

    $user = User::factory()->for($maker)->adminSpace()->create(['username' => 'adminlogin', 'password' => 'pass123']);
    SpaceOwner::factory()->for($user)->for($maker)->create();

    $response = $this->withHeaders($header)->postJson('/api/auth/login', [
        'username' => 'adminlogin',
        'password' => 'pass123',
    ]);

    $response->assertOk()
        ->assertJsonFragment(['status' => true])
        ->assertJsonStructure(['data' => ['user', 'space_owner', 'access_token']]);
});

test('auth: login fails with wrong password', function () {
    ['maker' => $maker, 'header' => $header] = makerWithHeader();

    User::factory()->for($maker)->member()->create(['username' => 'badpassuser', 'password' => 'correctpw']);

    $response = $this->withHeaders($header)->postJson('/api/auth/login', [
        'username' => 'badpassuser',
        'password' => 'wrongpw',
    ]);

    $response->assertUnauthorized()
        ->assertJsonFragment(['status' => false]);
});

test('auth: login fails for user in different maker scope', function () {
    ['maker' => $maker1] = makerWithHeader();
    ['header' => $header2] = makerWithHeader();

    // User milik maker1, tapi login pakai header maker2
    User::factory()->for($maker1)->member()->create(['username' => 'crossmaker', 'password' => 'password']);

    $response = $this->withHeaders($header2)->postJson('/api/auth/login', [
        'username' => 'crossmaker',
        'password' => 'password',
    ]);

    $response->assertUnauthorized()
        ->assertJsonFragment(['status' => false]);
});

// ─── INVALID TOKEN ───────────────────────────────────────────────────────────

test('auth: profile returns 401 for invalid token', function () {
    ['header' => $header] = makerWithHeader();

    $response = $this->withHeaders(array_merge($header, ['Authorization' => 'Bearer invalid_token_here']))
        ->getJson('/api/auth/profile');

    $response->assertUnauthorized()
        ->assertJsonFragment(['status' => false]);
});

test('auth: profile returns 401 without token', function () {
    ['header' => $header] = makerWithHeader();

    $response = $this->withHeaders($header)->getJson('/api/auth/profile');

    $response->assertUnauthorized();
});

test('auth: routes require x-maker-key header', function () {
    $response = $this->postJson('/api/auth/login', [
        'username' => 'test',
        'password' => 'test',
    ]);

    $response->assertStatus(400)
        ->assertJsonFragment(['status' => false]);
});
