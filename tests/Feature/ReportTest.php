<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Customer;
use App\Models\Product;
use App\Models\User;
use App\Services\SaleService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ReportTest extends TestCase
{
    use RefreshDatabase;

    private function makeSaleData(): void
    {
        $cashier = User::factory()->kasir()->create();
        $category = Category::factory()->create();
        $product = Product::factory()->for($category)->create([
            'stock' => 100,
            'sell_price' => 10000,
            'cost_price' => 6000,
        ]);

        app(SaleService::class)->create($cashier, [
            'items' => [['product_id' => $product->id, 'qty' => 5]],
            'payment_method' => 'tunai',
            'paid_amount' => 100000,
        ]);
    }

    public function test_dashboard_loads_with_kpis(): void
    {
        $this->makeSaleData();
        $owner = User::factory()->pemilik()->create();

        $this->actingAs($owner)
            ->get('/dashboard')
            ->assertInertia(fn ($page) => $page
                ->component('dashboard')
                ->where('kpi.omzet_hari_ini', 50000)
                ->where('kpi.transaksi_hari_ini', 1)
                ->where('kpi.laba_hari_ini', 20000) // 50.000 - (5 * 6.000)
            );
    }

    public function test_gross_profit_is_hidden_from_cashier_on_dashboard(): void
    {
        $this->makeSaleData();
        $cashier = User::factory()->kasir()->create();

        $this->actingAs($cashier)
            ->get('/dashboard')
            ->assertInertia(fn ($page) => $page->where('kpi.laba_hari_ini', null)->where('is_owner', false));
    }

    public function test_report_page_computes_summary_and_profit_for_owner(): void
    {
        $this->makeSaleData();
        $owner = User::factory()->pemilik()->create();
        $today = now()->toDateString();

        $this->actingAs($owner)
            ->get("/laporan?from={$today}&to={$today}")
            ->assertInertia(fn ($page) => $page
                ->component('laporan/index')
                ->where('summary.omzet', 50000)
                ->where('summary.transaksi', 1)
                ->where('profit.laba_kotor', 20000)
                ->where('inventory_value', fn ($v) => $v !== null)
            );
    }

    public function test_report_hides_profit_from_cashier(): void
    {
        $cashier = User::factory()->kasir()->create();

        $this->actingAs($cashier)
            ->get('/laporan')
            ->assertInertia(fn ($page) => $page->where('profit', null)->where('inventory_value', null));
    }

    public function test_receivables_report_lists_debtors(): void
    {
        Customer::factory()->create(['debt' => 250000, 'name' => 'Tukang Budi']);
        $owner = User::factory()->pemilik()->create();

        $this->actingAs($owner)
            ->get('/laporan')
            ->assertInertia(fn ($page) => $page->where('receivables.total', 250000));
    }

    public function test_csv_export_returns_csv(): void
    {
        $this->makeSaleData();
        $owner = User::factory()->pemilik()->create();

        $response = $this->actingAs($owner)->get('/laporan/ekspor?type=penjualan');
        $response->assertOk();
        $this->assertStringContainsString('text/csv', $response->headers->get('content-type'));
    }
}
