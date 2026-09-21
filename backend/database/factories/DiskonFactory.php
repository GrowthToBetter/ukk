<?php

namespace Database\Factories;

use App\Models\Diskon;
use App\Models\Maker;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Diskon>
 */
class DiskonFactory extends Factory
{
    protected $model = Diskon::class;

    public function definition(): array
    {
        return [
            'maker_id' => Maker::factory(),
            'nama_diskon' => strtoupper(fake()->unique()->bothify('PROMO-####')),
            'persentase_diskon' => fake()->randomElement(['10.00', '15.00', '20.00', '25.00']),
            'tanggal_awal' => now()->subDay(),
            'tanggal_akhir' => now()->addDays(30),
        ];
    }

    /** State: diskon masih aktif (default). */
    public function active(): static
    {
        return $this->state([
            'tanggal_awal' => now()->subDay(),
            'tanggal_akhir' => now()->addDays(30),
        ]);
    }

    /** State: diskon sudah expired. */
    public function expired(): static
    {
        return $this->state([
            'tanggal_awal' => now()->subDays(30),
            'tanggal_akhir' => now()->subDay(),
        ]);
    }

    /** State: diskon belum dimulai. */
    public function upcoming(): static
    {
        return $this->state([
            'tanggal_awal' => now()->addDay(),
            'tanggal_akhir' => now()->addDays(30),
        ]);
    }
}
