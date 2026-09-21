<?php

namespace Database\Factories;

use App\Models\Maker;
use App\Models\SpaceOwner;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<SpaceOwner>
 */
class SpaceOwnerFactory extends Factory
{
    protected $model = SpaceOwner::class;

    public function definition(): array
    {
        return [
            'user_id' => User::factory()->adminSpace(),
            'maker_id' => Maker::factory(),
            'nama_coworking' => fake()->company().' Coworking',
            'nama_pemilik' => fake()->name(),
            'telp' => fake()->numerify('08##########'),
        ];
    }
}
