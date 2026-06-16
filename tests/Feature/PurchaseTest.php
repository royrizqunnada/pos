<?php

namespace Tests\Feature;

use App\Models\Product;
use App\Models\StockMovement;
use App\Models\Supplier;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PurchaseTest extends TestCase
{
    use RefreshDatabase;

    public function test_purchase_increases_stock_and_updates_cost_price(): void
    {
        $owner = User::factory()->pemilik()->create();
        $supplier = Supplier::factory()->create();
        $product = Product::factory()->create(['stock' => 10, 'cost_price' => 60000]);

        $this->actingAs($owner)->post('/pembelian', [
            'supplier_id' => $supplier->id,
            'purchased_at' => now()->toDateString(),
            'items' => [
                ['product_id' => $product->id, 'qty' => 20, 'cost_price' => 62000],
            ],
        ])->assertRedirect('/pembelian');

        $product->refresh();
        $this->assertEquals(30, (float) $product->stock);
        $this->assertEquals(62000, $product->cost_price);

        $this->assertDatabaseHas('stock_movements', [
            'product_id' => $product->id,
            'type' => StockMovement::TYPE_PURCHASE,
            'qty_change' => '20.00',
            'stock_after' => '30.00',
        ]);
        $this->assertDatabaseHas('purchases', ['supplier_id' => $supplier->id, 'total' => 1240000]);
    }

    public function test_fractional_purchase_quantities_are_supported(): void
    {
        $owner = User::factory()->pemilik()->create();
        $supplier = Supplier::factory()->create();
        $product = Product::factory()->create(['stock' => 1.5, 'cost_price' => 200000]);

        $this->actingAs($owner)->post('/pembelian', [
            'supplier_id' => $supplier->id,
            'items' => [['product_id' => $product->id, 'qty' => 2.25, 'cost_price' => 220000]],
        ]);

        $this->assertEquals(3.75, (float) $product->fresh()->stock);
    }

    public function test_ref_no_is_generated_when_blank(): void
    {
        $owner = User::factory()->pemilik()->create();
        $supplier = Supplier::factory()->create();
        $product = Product::factory()->create();

        $this->actingAs($owner)->post('/pembelian', [
            'supplier_id' => $supplier->id,
            'items' => [['product_id' => $product->id, 'qty' => 1, 'cost_price' => 1000]],
        ]);

        $prefix = 'PB-'.now()->format('Ymd').'-';
        $this->assertDatabaseHas('purchases', ['ref_no' => $prefix.'0001']);
    }

    public function test_cashier_cannot_access_purchases(): void
    {
        $cashier = User::factory()->kasir()->create();

        $this->actingAs($cashier)->get('/pembelian')->assertForbidden();
        $this->actingAs($cashier)->get('/pemasok')->assertForbidden();
    }
}
