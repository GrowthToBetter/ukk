<?php

namespace Database\Factories;

use App\Models\Maker;
use App\Models\Member;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Member>
 */
class MemberFactory extends Factory
{
    protected $model = Member::class;

    public function definition(): array
    {
        return [
            'user_id' => User::factory()->member(),
            'maker_id' => Maker::factory(),
            'nama_member' => fake()->name(),
            'instansi' => fake()->company(),
            'alamat' => fake()->address(),
            'telp' => fake()->numerify('08##########'),
            'foto' => null,
        ];
    }
}
