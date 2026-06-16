<?php

namespace Database\Factories;

use App\Models\Purchase;
use App\Models\Supplier;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Purchase>
 */
class PurchaseFactory extends Factory
{
    public function definition(): array
    {
        return [
            'ref_no' => 'PB-'.now()->format('Ymd').'-'.fake()->unique()->numerify('####'),
            'supplier_id' => Supplier::factory(),
            'user_id' => User::factory(),
            'total' => fake()->numberBetween(10, 200) * 10000,
            'note' => null,
            'purchased_at' => now()->toDateString(),
        ];
    }
}
