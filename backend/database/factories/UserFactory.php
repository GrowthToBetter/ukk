<?php

namespace Database\Factories;

use App\Models\Maker;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<User>
 */
class UserFactory extends Factory
{
    protected $model = User::class;

    public function definition(): array
    {
        return [
            'maker_id' => Maker::factory(),
            'username' => fake()->unique()->userName(),
            'password' => 'password',
            'role' => 'member',
        ];
    }

    /** State: member role. */
    public function member(): static
    {
        return $this->state(['role' => 'member']);
    }

    /** State: admin_space role. */
    public function adminSpace(): static
    {
        return $this->state(['role' => 'admin_space']);
    }
}
