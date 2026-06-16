<?php

namespace Database\Seeders;

use App\Models\Customer;
use App\Models\Product;
use App\Models\Sale;
use App\Models\User;
use App\Services\SaleService;
use Carbon\CarbonImmutable;
use Illuminate\Database\Seeder;
use Illuminate\Validation\ValidationException;

class TransactionSeeder extends Seeder
{
    public function run(SaleService $sales): void
    {
        $cashier = User::where('role', User::ROLE_KASIR)->first()
            ?? User::where('role', User::ROLE_PEMILIK)->first();

        if (! $cashier) {
            return;
        }

        $customers = Customer::pluck('id')->all();

        // Generate sales spread across the last 10 days.
        for ($day = 9; $day >= 0; $day--) {
            $date = CarbonImmutable::today()->subDays($day);
            $count = random_int(2, 5);

            for ($n = 0; $n < $count; $n++) {
                $this->makeSale($sales, $cashier->fresh(), $customers, $date);
            }
        }
    }

    private function makeSale(SaleService $sales, User $cashier, array $customers, CarbonImmutable $date): void
    {
        $products = Product::where('stock', '>', 5)->inRandomOrder()->limit(random_int(1, 4))->get();
        if ($products->isEmpty()) {
            return;
        }

        $items = $products->map(fn (Product $p) => [
            'product_id' => $p->id,
            'qty' => random_int(1, 4),
        ])->all();

        $isDebt = ! empty($customers) && random_int(1, 100) <= 25;

        try {
            $sale = $sales->create($cashier, [
                'items' => $items,
                'payment_method' => $isDebt ? Sale::PAYMENT_UTANG : Sale::PAYMENT_TUNAI,
                'customer_id' => $isDebt ? $customers[array_rand($customers)] : null,
                'paid_amount' => $isDebt ? 0 : 100_000_000,
                'discount' => 0,
            ]);

            // Backdate so the dashboard chart shows historical spread.
            $sale->forceFill([
                'created_at' => $date->setTime(random_int(8, 17), random_int(0, 59)),
            ])->saveQuietly();
        } catch (ValidationException) {
            // Skip if stock ran out during seeding.
        }
    }
}
