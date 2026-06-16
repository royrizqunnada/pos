<?php

namespace Database\Factories;

use App\Models\Category;
use App\Models\Product;
use App\Models\Unit;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Product>
 */
class ProductFactory extends Factory
{
    public function definition(): array
    {
        $cost = fake()->numberBetween(5, 500) * 1000;
        $sell = (int) round($cost * fake()->randomFloat(2, 1.1, 1.4));

        return [
            'sku' => strtoupper(fake()->unique()->bothify('SKU-####')),
            'barcode' => fake()->boolean(60) ? fake()->unique()->ean13() : null,
            'name' => ucfirst(fake()->unique()->words(2, true)),
            'category_id' => Category::factory(),
            'unit_id' => Unit::factory(),
            'cost_price' => $cost,
            'sell_price' => $sell,
            'wholesale_price' => null,
            'wholesale_min_qty' => null,
            'stock' => fake()->randomFloat(2, 0, 200),
            'min_stock' => fake()->numberBetween(0, 10),
            'is_active' => true,
        ];
    }

    public function withWholesale(): static
    {
        return $this->state(function (array $attributes) {
            return [
                'wholesale_price' => (int) round($attributes['sell_price'] * 0.9),
                'wholesale_min_qty' => fake()->numberBetween(5, 20),
            ];
        });
    }

    public function lowStock(): static
    {
        return $this->state(fn () => ['stock' => 2, 'min_stock' => 5]);
    }
}
