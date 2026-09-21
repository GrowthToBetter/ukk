<?php

use App\Models\Diskon;
use App\Models\Maker;

// ─── ACTIVE LIST ─────────────────────────────────────────────────────────────

test('diskon: list active only returns currently active discounts', function () {
    $maker = Maker::factory()->create();
    $header = ['x-maker-key' => $maker->app_key];

    Diskon::factory()->active()->for($maker)->count(2)->create();
    Diskon::factory()->expired()->for($maker)->count(1)->create();
    Diskon::factory()->upcoming()->for($maker)->count(1)->create();

    $response = $this->withHeaders($header)->getJson('/api/diskon/active');

    $response->assertOk()
        ->assertJsonFragment(['status' => true]);

    expect($response->json('data.total'))->toBe(2);
});

test('diskon: active list is scoped per maker', function () {
    $maker1 = Maker::factory()->create();
    $header1 = ['x-maker-key' => $maker1->app_key];

    $maker2 = Maker::factory()->create();

    Diskon::factory()->active()->for($maker1)->count(3)->create();
    Diskon::factory()->active()->for($maker2)->count(5)->create();

    $response = $this->withHeaders($header1)->getJson('/api/diskon/active');

    $response->assertOk();
    expect($response->json('data.total'))->toBe(3);
});

// ─── CHECK PROMO ─────────────────────────────────────────────────────────────

test('diskon: check returns valid for active promo', function () {
    $maker = Maker::factory()->create();
    $header = ['x-maker-key' => $maker->app_key];
    $diskon = Diskon::factory()->active()->for($maker)->create(['nama_diskon' => 'PROMO-VALID']);

    $response = $this->withHeaders($header)->postJson('/api/diskon/check', [
        'nama_diskon' => 'PROMO-VALID',
    ]);

    $response->assertOk()
        ->assertJsonFragment(['status' => true])
        ->assertJsonFragment(['is_active' => true]);
});

test('diskon: check returns is_active false for expired promo', function () {
    $maker = Maker::factory()->create();
    $header = ['x-maker-key' => $maker->app_key];
    Diskon::factory()->expired()->for($maker)->create(['nama_diskon' => 'PROMO-EXPIRED']);

    $response = $this->withHeaders($header)->postJson('/api/diskon/check', [
        'nama_diskon' => 'PROMO-EXPIRED',
    ]);

    $response->assertOk()
        ->assertJsonFragment(['is_active' => false]);
});

test('diskon: check returns is_active false for upcoming promo', function () {
    $maker = Maker::factory()->create();
    $header = ['x-maker-key' => $maker->app_key];
    Diskon::factory()->upcoming()->for($maker)->create(['nama_diskon' => 'PROMO-UPCOMING']);

    $response = $this->withHeaders($header)->postJson('/api/diskon/check', [
        'nama_diskon' => 'PROMO-UPCOMING',
    ]);

    $response->assertOk()
        ->assertJsonFragment(['is_active' => false]);
});

test('diskon: check returns 404 for nonexistent promo code', function () {
    $maker = Maker::factory()->create();
    $header = ['x-maker-key' => $maker->app_key];

    $response = $this->withHeaders($header)->postJson('/api/diskon/check', [
        'nama_diskon' => 'PROMO-GHOST',
    ]);

    $response->assertNotFound()
        ->assertJsonFragment(['status' => false]);
});

test('diskon: check is scoped to maker (promo from other maker not found)', function () {
    $maker1 = Maker::factory()->create();
    $maker2 = Maker::factory()->create();
    $header1 = ['x-maker-key' => $maker1->app_key];

    Diskon::factory()->active()->for($maker2)->create(['nama_diskon' => 'PROMO-OTHER']);

    $response = $this->withHeaders($header1)->postJson('/api/diskon/check', [
        'nama_diskon' => 'PROMO-OTHER',
    ]);

    $response->assertNotFound()
        ->assertJsonFragment(['status' => false]);
});

// ─── DETAIL ──────────────────────────────────────────────────────────────────

test('diskon: show returns detail for valid id', function () {
    $maker = Maker::factory()->create();
    $header = ['x-maker-key' => $maker->app_key];
    $diskon = Diskon::factory()->active()->for($maker)->create();

    $response = $this->withHeaders($header)->getJson("/api/diskon/{$diskon->id}");

    $response->assertOk()
        ->assertJsonFragment(['nama_diskon' => $diskon->nama_diskon]);
});

test('diskon: show returns 404 for diskon of other maker', function () {
    $maker1 = Maker::factory()->create();
    $maker2 = Maker::factory()->create();
    $header1 = ['x-maker-key' => $maker1->app_key];

    $diskon = Diskon::factory()->active()->for($maker2)->create();

    $response = $this->withHeaders($header1)->getJson("/api/diskon/{$diskon->id}");

    $response->assertNotFound();
});
