<?php

namespace Database\Factories;

use App\Models\Product;
use App\Models\StockMovement;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<StockMovement>
 */
class StockMovementFactory extends Factory
{
    public function definition(): array
    {
        $qty = fake()->randomFloat(2, 1, 50);

        return [
            'product_id' => Product::factory(),
            'type' => StockMovement::TYPE_INITIAL,
            'qty_change' => $qty,
            'stock_after' => $qty,
            'ref_type' => null,
            'ref_id' => null,
            'note' => null,
        ];
    }
}
