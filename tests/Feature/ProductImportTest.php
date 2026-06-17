<?php

namespace Tests\Feature;

use App\Models\Product;
use App\Models\StockMovement;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Tests\TestCase;

class ProductImportTest extends TestCase
{
    use RefreshDatabase;

    private function csv(string $body): UploadedFile
    {
        $path = tempnam(sys_get_temp_dir(), 'imp').'.csv';
        file_put_contents($path, $body);

        return new UploadedFile($path, 'barang.csv', 'text/csv', null, true);
    }

    public function test_owner_can_import_products_with_stock(): void
    {
        $owner = User::factory()->pemilik()->create();
        $csv = "nama,kategori,satuan,harga_modal,harga_jual,stok,stok_minimum\n"
            ."Semen Tiga Roda 50kg,Semen,sak,62000,68000,120,20\n"
            ."Pasir Beton,Material Curah,m³,220000,285000,12.5,3\n";

        $this->actingAs($owner)
            ->post('/barang/impor', ['file' => $this->csv($csv)])
            ->assertRedirect();

        $this->assertDatabaseCount('products', 2);
        $semen = Product::firstWhere('name', 'Semen Tiga Roda 50kg');
        $this->assertEquals(120, (float) $semen->stock);
        $this->assertEquals(68000, $semen->sell_price);
        $this->assertEquals(12.5, (float) Product::firstWhere('name', 'Pasir Beton')->stock);

        // categories & units auto-created
        $this->assertDatabaseHas('categories', ['name' => 'Semen']);
        $this->assertDatabaseHas('units', ['name' => 'm³']);

        $this->assertDatabaseHas('stock_movements', [
            'product_id' => $semen->id,
            'type' => StockMovement::TYPE_INITIAL,
            'qty_change' => '120.00',
        ]);
    }

    public function test_import_updates_existing_product_and_adds_stock(): void
    {
        $owner = User::factory()->pemilik()->create();
        $product = Product::factory()->create(['sku' => 'BJ-0001', 'name' => 'Semen', 'stock' => 10, 'sell_price' => 60000]);

        $csv = "nama,sku,harga_jual,stok\nSemen Tiga Roda,BJ-0001,70000,5\n";

        $this->actingAs($owner)->post('/barang/impor', ['file' => $this->csv($csv)]);

        $product->refresh();
        $this->assertEquals(70000, $product->sell_price);
        $this->assertEquals(15, (float) $product->stock); // 10 + 5
        $this->assertDatabaseCount('products', 1);
    }

    public function test_import_rejects_rows_without_name(): void
    {
        $owner = User::factory()->pemilik()->create();
        $csv = "nama,harga_jual,stok\n,5000,3\n";

        $this->actingAs($owner)
            ->from('/barang')
            ->post('/barang/impor', ['file' => $this->csv($csv)])
            ->assertSessionHasErrors('file');

        $this->assertDatabaseCount('products', 0);
    }

    public function test_cashier_cannot_import(): void
    {
        $cashier = User::factory()->kasir()->create();
        $csv = "nama,harga_jual,stok\nX,5000,3\n";

        $this->actingAs($cashier)->post('/barang/impor', ['file' => $this->csv($csv)])->assertForbidden();
    }
}
