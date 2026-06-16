<?php

namespace Database\Factories;

use App\Models\Customer;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Customer>
 */
class CustomerFactory extends Factory
{
    public function definition(): array
    {
        return [
            'name' => fake()->name(),
            'phone' => fake()->numerify('08##########'),
            'address' => fake()->streetAddress(),
            'note' => null,
            'debt' => 0,
        ];
    }

    public function withDebt(int $amount = 500000): static
    {
        return $this->state(fn () => ['debt' => $amount]);
    }
}
