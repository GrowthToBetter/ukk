<?php

namespace Database\Factories;

use App\Models\Maker;
use App\Models\Space;
use App\Models\SpaceOwner;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Space>
 */
class SpaceFactory extends Factory
{
    protected $model = Space::class;

    public function definition(): array
    {
        return [
            'maker_id' => Maker::factory(),
            'id_owner' => SpaceOwner::factory(),
            'nama_space' => fake()->words(3, true).' Space',
            'harga_per_jam' => fake()->randomElement([50000, 75000, 100000, 150000]),
            'tipe' => fake()->randomElement(['desk', 'meeting_room', 'private_office']),
            'kapasitas' => fake()->numberBetween(1, 20),
            'deskripsi' => fake()->sentence(),
            'foto' => null,
        ];
    }

    public function desk(): static
    {
        return $this->state(['tipe' => 'desk']);
    }

    public function meetingRoom(): static
    {
        return $this->state(['tipe' => 'meeting_room']);
    }

    public function privateOffice(): static
    {
        return $this->state(['tipe' => 'private_office']);
    }
}
