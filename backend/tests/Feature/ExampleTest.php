<?php

test('api root returns ok', function () {
    $response = $this->getJson('/api');

    $response->assertOk()
        ->assertJsonFragment(['status' => true]);
});
