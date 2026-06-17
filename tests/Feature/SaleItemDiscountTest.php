<?php

namespace Tests\Feature;

use App\Models\Product;
use App\Models\Sale;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SaleItemDiscountTest extends TestCase
{
    use RefreshDatabase;

    public function test_per_item_discount_reduces_line_and_total(): void
    {
        $cashier = User::factory()->kasir()->create();
        $product = Product::factory()->create(['stock' => 100, 'sell_price' => 10000]);

        $this->actingAs($cashier)->post('/kasir', [
            'items' => [['product_id' => $product->id, 'qty' => 3, 'discount' => 5000]],
            'payment_method' => 'tunai',
            'paid_amount' => 100000,
        ])->assertRedirect('/kasir');

        $sale = Sale::first();
        // 3 * 10.000 = 30.000 - 5.000 diskon item = 25.000
        $this->assertEquals(25000, $sale->subtotal);
        $this->assertEquals(25000, $sale->total);
        $item = $sale->items->first();
        $this->assertEquals(5000, $item->discount);
        $this->assertEquals(25000, $item->subtotal);
    }

    public function test_item_discount_cannot_exceed_line_total(): void
    {
        $cashier = User::factory()->kasir()->create();
        $product = Product::factory()->create(['stock' => 100, 'sell_price' => 10000]);

        $this->actingAs($cashier)
            ->from('/kasir')
            ->post('/kasir', [
                'items' => [['product_id' => $product->id, 'qty' => 2, 'discount' => 50000]],
                'payment_method' => 'tunai',
                'paid_amount' => 100000,
            ])
            ->assertSessionHasErrors('items');

        $this->assertDatabaseCount('sales', 0);
    }
}
