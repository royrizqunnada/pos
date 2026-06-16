<?php

namespace Tests\Feature;

use App\Models\Customer;
use App\Models\Product;
use App\Models\Sale;
use App\Models\StockMovement;
use App\Models\User;
use App\Services\ReportService;
use App\Services\SaleService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SaleVoidTest extends TestCase
{
    use RefreshDatabase;

    private function cashSale(Product $product, int $qty = 3): Sale
    {
        return app(SaleService::class)->create(User::factory()->kasir()->create(), [
            'items' => [['product_id' => $product->id, 'qty' => $qty]],
            'payment_method' => 'tunai',
            'paid_amount' => 100_000_000,
        ]);
    }

    public function test_owner_can_void_a_cash_sale_and_stock_is_restored(): void
    {
        $owner = User::factory()->pemilik()->create();
        $product = Product::factory()->create(['stock' => 100, 'sell_price' => 10000]);
        $sale = $this->cashSale($product, 3);

        $this->assertEquals(97, (float) $product->fresh()->stock);

        $this->actingAs($owner)
            ->post("/penjualan/{$sale->id}/batal", ['reason' => 'Salah input'])
            ->assertRedirect();

        $sale->refresh();
        $this->assertTrue($sale->isVoided());
        $this->assertEquals(100, (float) $product->fresh()->stock);
        $this->assertDatabaseHas('stock_movements', [
            'product_id' => $product->id,
            'type' => StockMovement::TYPE_RETURN,
            'qty_change' => '3.00',
        ]);
    }

    public function test_voiding_debt_sale_reverses_customer_debt(): void
    {
        $owner = User::factory()->pemilik()->create();
        $cashier = User::factory()->kasir()->create();
        $product = Product::factory()->create(['stock' => 100, 'sell_price' => 25000]);
        $customer = Customer::factory()->create(['debt' => 0]);

        $sale = app(SaleService::class)->create($cashier, [
            'items' => [['product_id' => $product->id, 'qty' => 2]],
            'payment_method' => 'utang',
            'customer_id' => $customer->id,
        ]);
        $this->assertEquals(50000, $customer->fresh()->debt);

        $this->actingAs($owner)->post("/penjualan/{$sale->id}/batal");

        $this->assertEquals(0, $customer->fresh()->debt);
    }

    public function test_cashier_cannot_void_a_sale(): void
    {
        $cashier = User::factory()->kasir()->create();
        $product = Product::factory()->create(['stock' => 100, 'sell_price' => 10000]);
        $sale = $this->cashSale($product);

        $this->actingAs($cashier)->post("/penjualan/{$sale->id}/batal")->assertForbidden();
        $this->assertFalse($sale->fresh()->isVoided());
    }

    public function test_voided_sale_is_excluded_from_reports(): void
    {
        $owner = User::factory()->pemilik()->create();
        $product = Product::factory()->create(['stock' => 100, 'sell_price' => 10000, 'cost_price' => 6000]);
        $sale = $this->cashSale($product, 3); // omzet 30.000

        app(SaleService::class)->void($sale, $owner);

        $today = now()->toDateString();
        $report = app(ReportService::class);
        $this->assertEquals(0, $report->salesSummary($today, $today)['omzet']);
        $this->assertEquals(0, $report->grossProfit($today, $today)['laba_kotor']);
    }

    public function test_sale_cannot_be_voided_twice(): void
    {
        $owner = User::factory()->pemilik()->create();
        $product = Product::factory()->create(['stock' => 100, 'sell_price' => 10000]);
        $sale = $this->cashSale($product);
        app(SaleService::class)->void($sale, $owner);

        $this->actingAs($owner)
            ->from("/penjualan/{$sale->id}")
            ->post("/penjualan/{$sale->id}/batal")
            ->assertSessionHasErrors('sale');
    }

    public function test_history_and_stock_card_pages_render(): void
    {
        $owner = User::factory()->pemilik()->create();
        $product = Product::factory()->create(['stock' => 50]);
        $this->cashSale($product, 2);

        $this->actingAs($owner)->get('/penjualan')
            ->assertInertia(fn ($p) => $p->component('penjualan/index'));

        $this->actingAs($owner)->get("/barang/{$product->id}/kartu-stok")
            ->assertInertia(fn ($p) => $p->component('barang/kartu-stok'));
    }
}
