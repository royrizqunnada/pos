<?php

namespace Tests\Feature;

use App\Models\Customer;
use App\Models\Product;
use App\Models\Sale;
use App\Models\StockMovement;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SaleTest extends TestCase
{
    use RefreshDatabase;

    private function cashier(): User
    {
        return User::factory()->kasir()->create();
    }

    public function test_cash_sale_reduces_stock_and_records_movement(): void
    {
        $cashier = $this->cashier();
        $product = Product::factory()->create(['stock' => 100, 'sell_price' => 10000]);

        $this->actingAs($cashier)->post('/kasir', [
            'items' => [['product_id' => $product->id, 'qty' => 3]],
            'payment_method' => 'tunai',
            'paid_amount' => 50000,
        ])->assertRedirect('/kasir');

        $product->refresh();
        $this->assertEquals(97, (float) $product->stock);

        $sale = Sale::first();
        $this->assertEquals(30000, $sale->total);
        $this->assertEquals(20000, $sale->change_amount);
        $this->assertEquals('lunas', $sale->status);

        $this->assertDatabaseHas('stock_movements', [
            'product_id' => $product->id,
            'type' => StockMovement::TYPE_SALE,
            'qty_change' => '-3.00',
            'stock_after' => '97.00',
        ]);
    }

    public function test_debt_sale_adds_to_customer_debt_and_keeps_paid_zero(): void
    {
        $cashier = $this->cashier();
        $product = Product::factory()->create(['stock' => 100, 'sell_price' => 25000]);
        $customer = Customer::factory()->create(['debt' => 0]);

        $this->actingAs($cashier)->post('/kasir', [
            'items' => [['product_id' => $product->id, 'qty' => 2]],
            'payment_method' => 'utang',
            'customer_id' => $customer->id,
        ])->assertRedirect('/kasir');

        $sale = Sale::first();
        $this->assertEquals('utang', $sale->status);
        $this->assertEquals(0, $sale->paid_amount);
        $this->assertEquals(50000, $sale->total);
        $this->assertEquals(50000, $customer->fresh()->debt);
    }

    public function test_wholesale_price_applies_when_qty_meets_minimum(): void
    {
        $cashier = $this->cashier();
        $product = Product::factory()->create([
            'stock' => 100,
            'sell_price' => 68000,
            'wholesale_price' => 66000,
            'wholesale_min_qty' => 10,
        ]);

        $this->actingAs($cashier)->post('/kasir', [
            'items' => [['product_id' => $product->id, 'qty' => 10]],
            'payment_method' => 'tunai',
            'paid_amount' => 1000000,
        ]);

        $sale = Sale::first();
        $this->assertEquals(660000, $sale->total); // 10 * 66.000 wholesale
        $this->assertEquals(66000, $sale->items->first()->price);
    }

    public function test_normal_price_applies_below_wholesale_minimum(): void
    {
        $cashier = $this->cashier();
        $product = Product::factory()->create([
            'stock' => 100,
            'sell_price' => 68000,
            'wholesale_price' => 66000,
            'wholesale_min_qty' => 10,
        ]);

        $this->actingAs($cashier)->post('/kasir', [
            'items' => [['product_id' => $product->id, 'qty' => 5]],
            'payment_method' => 'tunai',
            'paid_amount' => 1000000,
        ]);

        $this->assertEquals(340000, Sale::first()->total); // 5 * 68.000
    }

    public function test_cash_sale_is_rejected_when_payment_is_insufficient(): void
    {
        $cashier = $this->cashier();
        $product = Product::factory()->create(['stock' => 100, 'sell_price' => 10000]);

        $this->actingAs($cashier)
            ->from('/kasir')
            ->post('/kasir', [
                'items' => [['product_id' => $product->id, 'qty' => 3]],
                'payment_method' => 'tunai',
                'paid_amount' => 10000,
            ])
            ->assertSessionHasErrors('paid_amount');

        $this->assertDatabaseCount('sales', 0);
        $this->assertEquals(100, (float) $product->fresh()->stock);
    }

    public function test_sale_is_rejected_when_stock_insufficient(): void
    {
        $cashier = $this->cashier();
        $product = Product::factory()->create(['stock' => 2, 'sell_price' => 10000]);

        $this->actingAs($cashier)
            ->from('/kasir')
            ->post('/kasir', [
                'items' => [['product_id' => $product->id, 'qty' => 5]],
                'payment_method' => 'tunai',
                'paid_amount' => 100000,
            ])
            ->assertSessionHasErrors('items');

        $this->assertDatabaseCount('sales', 0);
    }

    public function test_debt_sale_requires_customer(): void
    {
        $cashier = $this->cashier();
        $product = Product::factory()->create(['stock' => 100, 'sell_price' => 10000]);

        $this->actingAs($cashier)
            ->from('/kasir')
            ->post('/kasir', [
                'items' => [['product_id' => $product->id, 'qty' => 1]],
                'payment_method' => 'utang',
            ])
            ->assertSessionHasErrors('customer_id');

        $this->assertDatabaseCount('sales', 0);
    }

    public function test_invoice_numbers_increment_sequentially_per_day(): void
    {
        $cashier = $this->cashier();
        $product = Product::factory()->create(['stock' => 100, 'sell_price' => 10000]);

        for ($i = 0; $i < 2; $i++) {
            $this->actingAs($cashier)->post('/kasir', [
                'items' => [['product_id' => $product->id, 'qty' => 1]],
                'payment_method' => 'tunai',
                'paid_amount' => 10000,
            ]);
        }

        $prefix = 'TRX-'.now()->format('Ymd').'-';
        $this->assertNotNull(Sale::firstWhere('invoice_no', $prefix.'0001'));
        $this->assertNotNull(Sale::firstWhere('invoice_no', $prefix.'0002'));
    }
}
