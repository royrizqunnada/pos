<?php

namespace Database\Factories;

use App\Models\Product;
use App\Models\Sale;
use App\Models\SaleItem;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<SaleItem>
 */
class SaleItemFactory extends Factory
{
    public function definition(): array
    {
        $qty = fake()->numberBetween(1, 10);
        $price = fake()->numberBetween(5, 100) * 1000;

        return [
            'sale_id' => Sale::factory(),
            'product_id' => Product::factory(),
            'product_name' => fake()->words(2, true),
            'unit_name' => 'pcs',
            'qty' => $qty,
            'price' => $price,
            'subtotal' => $qty * $price,
        ];
    }
}
