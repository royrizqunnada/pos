<?php

namespace Database\Factories;

use App\Models\Product;
use App\Models\Purchase;
use App\Models\PurchaseItem;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<PurchaseItem>
 */
class PurchaseItemFactory extends Factory
{
    public function definition(): array
    {
        $qty = fake()->numberBetween(1, 20);
        $cost = fake()->numberBetween(5, 100) * 1000;

        return [
            'purchase_id' => Purchase::factory(),
            'product_id' => Product::factory(),
            'qty' => $qty,
            'cost_price' => $cost,
            'subtotal' => $qty * $cost,
        ];
    }
}
