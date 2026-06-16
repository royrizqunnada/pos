<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Product;
use App\Models\StockMovement;
use App\Models\Unit;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProductManagementTest extends TestCase
{
    use RefreshDatabase;

    private function productPayload(array $overrides = []): array
    {
        return array_merge([
            'name' => 'Semen Tiga Roda 50kg',
            'sku' => 'BJ-0001',
            'barcode' => null,
            'category_id' => Category::factory()->create()->id,
            'unit_id' => Unit::factory()->create()->id,
            'cost_price' => 62000,
            'sell_price' => 68000,
            'wholesale_price' => null,
            'wholesale_min_qty' => null,
            'stock' => 100,
            'min_stock' => 20,
            'is_active' => true,
        ], $overrides);
    }

    public function test_owner_can_create_product_and_initial_stock_movement_is_written(): void
    {
        $owner = User::factory()->pemilik()->create();

        $this->actingAs($owner)
            ->post('/barang', $this->productPayload())
            ->assertRedirect('/barang');

        $product = Product::firstWhere('name', 'Semen Tiga Roda 50kg');
        $this->assertNotNull($product);
        $this->assertEquals(100, (float) $product->stock);

        $this->assertDatabaseHas('stock_movements', [
            'product_id' => $product->id,
            'type' => StockMovement::TYPE_INITIAL,
            'qty_change' => '100.00',
            'stock_after' => '100.00',
        ]);
    }

    public function test_cashier_cannot_create_product(): void
    {
        $cashier = User::factory()->kasir()->create();

        $this->actingAs($cashier)
            ->post('/barang', $this->productPayload())
            ->assertForbidden();

        $this->assertDatabaseCount('products', 0);
    }

    public function test_adjustment_updates_stock_and_records_movement(): void
    {
        $owner = User::factory()->pemilik()->create();
        $product = Product::factory()->create(['stock' => 50]);

        $this->actingAs($owner)
            ->post("/barang/{$product->id}/penyesuaian", ['stock' => 42, 'reason' => 'Selisih opname'])
            ->assertRedirect();

        $this->assertEquals(42, (float) $product->fresh()->stock);
        $this->assertDatabaseHas('stock_movements', [
            'product_id' => $product->id,
            'type' => StockMovement::TYPE_ADJUSTMENT,
            'qty_change' => '-8.00',
            'stock_after' => '42.00',
            'note' => 'Selisih opname',
        ]);
    }

    public function test_add_stock_increases_stock(): void
    {
        $owner = User::factory()->pemilik()->create();
        $product = Product::factory()->create(['stock' => 10]);

        $this->actingAs($owner)
            ->post("/barang/{$product->id}/stok", ['qty' => 5.5])
            ->assertRedirect();

        $this->assertEquals(15.5, (float) $product->fresh()->stock);
    }

    public function test_cashier_cannot_adjust_stock(): void
    {
        $cashier = User::factory()->kasir()->create();
        $product = Product::factory()->create(['stock' => 10]);

        $this->actingAs($cashier)
            ->post("/barang/{$product->id}/penyesuaian", ['stock' => 5, 'reason' => 'x'])
            ->assertForbidden();
    }

    public function test_cost_price_is_hidden_from_cashier_in_listing(): void
    {
        $cashier = User::factory()->kasir()->create();
        Product::factory()->create(['cost_price' => 50000]);

        $this->actingAs($cashier)
            ->get('/barang')
            ->assertInertia(fn ($page) => $page
                ->component('barang/index')
                ->where('can.view_cost', false)
                ->where('products.data.0.cost_price', null)
            );
    }

    public function test_low_stock_scope_filters_products(): void
    {
        Product::factory()->create(['stock' => 2, 'min_stock' => 5]);
        Product::factory()->create(['stock' => 50, 'min_stock' => 5]);

        $this->assertSame(1, Product::lowStock()->count());
    }
}
