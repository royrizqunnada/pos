<?php

namespace Database\Factories;

use App\Models\Sale;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Sale>
 */
class SaleFactory extends Factory
{
    public function definition(): array
    {
        $total = fake()->numberBetween(1, 50) * 10000;

        return [
            'invoice_no' => 'TRX-'.now()->format('Ymd').'-'.fake()->unique()->numerify('####'),
            'user_id' => User::factory(),
            'customer_id' => null,
            'subtotal' => $total,
            'discount' => 0,
            'total' => $total,
            'payment_method' => Sale::PAYMENT_TUNAI,
            'paid_amount' => $total,
            'change_amount' => 0,
            'status' => Sale::STATUS_LUNAS,
            'note' => null,
        ];
    }
}
