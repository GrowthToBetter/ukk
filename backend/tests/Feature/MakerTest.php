<?php

use App\Models\Maker;

// ─── REGISTER ───────────────────────────────────────────────────────────────

test('maker can register with valid data', function () {
    $response = $this->postJson('/api/maker/register', [
        'name' => 'Test Maker',
        'username' => 'testmaker',
        'email' => 'testmaker@example.com',
        'password' => 'password123',
    ]);

    $response->assertCreated()
        ->assertJsonFragment(['status' => true])
        ->assertJsonStructure([
            'data' => [
                'maker' => ['id', 'name', 'username', 'email', 'app_key', 'created_at'],
                'access_token',
                'token_type',
            ],
        ]);

    $this->assertDatabaseHas('makers', ['username' => 'testmaker']);
});

test('maker register fails when username already taken', function () {
    Maker::factory()->create(['username' => 'takenuser']);

    $response = $this->postJson('/api/maker/register', [
        'name' => 'Another Maker',
        'username' => 'takenuser',
        'email' => 'another@example.com',
        'password' => 'password123',
    ]);

    $response->assertUnprocessable()
        ->assertJsonFragment(['status' => false]);
});

test('maker register fails when email already taken', function () {
    Maker::factory()->create(['email' => 'taken@example.com']);

    $response = $this->postJson('/api/maker/register', [
        'name' => 'Another Maker',
        'username' => 'brandnewuser',
        'email' => 'taken@example.com',
        'password' => 'password123',
    ]);

    $response->assertUnprocessable()
        ->assertJsonFragment(['status' => false]);
});

test('maker register returns app_key on success', function () {
    $response = $this->postJson('/api/maker/register', [
        'name' => 'Key Maker',
        'username' => 'keymaker',
        'email' => 'keymaker@example.com',
        'password' => 'secret123',
    ]);

    $response->assertCreated();

    $appKey = $response->json('data.maker.app_key');
    expect($appKey)->toStartWith('mk_');
});

// ─── LOGIN ───────────────────────────────────────────────────────────────────

test('maker can login with username', function () {
    Maker::factory()->create([
        'username' => 'loginuser',
        'email' => 'loginuser@example.com',
        'password' => 'password123',
    ]);

    $response = $this->postJson('/api/maker/login', [
        'usernameOrEmail' => 'loginuser',
        'password' => 'password123',
    ]);

    $response->assertOk()
        ->assertJsonFragment(['status' => true])
        ->assertJsonStructure(['data' => ['maker', 'access_token', 'token_type']]);
});

test('maker can login with email', function () {
    Maker::factory()->create([
        'username' => 'emailloginuser',
        'email' => 'emaillogin@example.com',
        'password' => 'password123',
    ]);

    $response = $this->postJson('/api/maker/login', [
        'usernameOrEmail' => 'emaillogin@example.com',
        'password' => 'password123',
    ]);

    $response->assertOk()
        ->assertJsonFragment(['status' => true]);
});

test('maker login fails with wrong password', function () {
    Maker::factory()->create([
        'username' => 'wrongpassuser',
        'password' => 'correctpassword',
    ]);

    $response = $this->postJson('/api/maker/login', [
        'usernameOrEmail' => 'wrongpassuser',
        'password' => 'wrongpassword',
    ]);

    $response->assertUnauthorized()
        ->assertJsonFragment(['status' => false]);
});

test('maker login fails with nonexistent username', function () {
    $response = $this->postJson('/api/maker/login', [
        'usernameOrEmail' => 'nobody',
        'password' => 'password',
    ]);

    $response->assertUnauthorized()
        ->assertJsonFragment(['status' => false]);
});

// ─── LIST ────────────────────────────────────────────────────────────────────

test('maker list returns all makers', function () {
    Maker::factory()->count(3)->create();

    $response = $this->getJson('/api/maker/list');

    $response->assertOk()
        ->assertJsonFragment(['status' => true])
        ->assertJsonStructure(['data' => ['makers', 'total']]);

    expect($response->json('data.total'))->toBeGreaterThanOrEqual(3);
});

// ─── ME (auth) ───────────────────────────────────────────────────────────────

test('maker me returns profile for authenticated maker', function () {
    $maker = Maker::factory()->create();
    $token = $maker->createToken('test')->plainTextToken;

    $response = $this->withToken($token)->getJson('/api/maker/me');

    $response->assertOk()
        ->assertJsonFragment(['username' => $maker->username]);
});

test('maker me returns 401 without token', function () {
    $response = $this->getJson('/api/maker/me');

    $response->assertUnauthorized();
});
