<?php

namespace Database\Factories;

use App\Models\Maker;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Maker>
 */
class MakerFactory extends Factory
{
    protected $model = Maker::class;

    public function definition(): array
    {
        return [
            'name' => fake()->company(),
            'username' => fake()->unique()->userName(),
            'email' => fake()->unique()->safeEmail(),
            'password' => 'password',
        ];
    }
}
