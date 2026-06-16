<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Product;
use App\Models\StockMovement;
use App\Models\Unit;
use Illuminate\Database\Seeder;

class ProductSeeder extends Seeder
{
    public function run(): void
    {
        $cat = Category::pluck('id', 'name');
        $unit = Unit::pluck('id', 'name');

        // [name, category, unit, cost, sell, stock, min, barcode, wholesale_price, wholesale_min_qty]
        $items = [
            ['Semen Tiga Roda 50kg', 'Semen & Perekat', 'sak', 62000, 68000, 120, 20, '8991002100015', 66000, 10],
            ['Semen Gresik 50kg', 'Semen & Perekat', 'sak', 61000, 67000, 80, 20, '8992701100022', 65000, 10],
            ['Semen Mortar Instan MU-301 40kg', 'Semen & Perekat', 'sak', 78000, 88000, 45, 10, '8993000300017', null, null],
            ['Lem Fox Putih 1kg', 'Semen & Perekat', 'kaleng', 28000, 35000, 30, 5, '8990010100024', null, null],

            ['Besi Beton Polos 8mm', 'Besi & Baja', 'batang', 48000, 56000, 200, 30, null, 53000, 20],
            ['Besi Beton Polos 10mm', 'Besi & Baja', 'batang', 72000, 82000, 150, 30, null, 79000, 20],
            ['Besi Beton Ulir 12mm', 'Besi & Baja', 'batang', 105000, 118000, 90, 20, null, 114000, 20],
            ['Kawat Bendrat', 'Besi & Baja', 'kg', 18000, 23000, 40.5, 5, null, null, null],

            ['Triplek 9mm 122x244', 'Kayu & Triplek', 'lembar', 95000, 112000, 60, 10, null, 108000, 10],
            ['Triplek 12mm 122x244', 'Kayu & Triplek', 'lembar', 135000, 158000, 40, 10, null, null, null],
            ['Kayu Kaso 5x7 4m', 'Kayu & Triplek', 'batang', 38000, 47000, 110, 20, null, null, null],

            ['Pasir Beton', 'Material Curah', 'm³', 220000, 285000, 12.5, 3, null, null, null],
            ['Batu Split 1/2', 'Material Curah', 'm³', 240000, 310000, 8.75, 2, null, null, null],
            ['Tanah Urug', 'Material Curah', 'm³', 90000, 130000, 15, 3, null, null, null],

            ['Cat Tembok Avitex 5kg', 'Cat & Pelapis', 'kaleng', 62000, 78000, 35, 6, '8991234500019', null, null],
            ['Cat Kayu & Besi Avian 1kg', 'Cat & Pelapis', 'kaleng', 48000, 62000, 28, 6, '8991234500026', null, null],
            ['Cat Genteng Nodrop 4kg', 'Cat & Pelapis', 'kaleng', 88000, 110000, 18, 4, '8991234500033', null, null],

            ['Pipa PVC Rucika 3 inch', 'Pipa & Sanitasi', 'batang', 72000, 88000, 50, 10, null, null, null],
            ['Pipa PVC Rucika 4 inch', 'Pipa & Sanitasi', 'batang', 98000, 120000, 35, 8, null, null, null],
            ['Kran Air Onda 1/2', 'Pipa & Sanitasi', 'buah', 25000, 35000, 60, 10, '8997012300014', null, null],

            ['Keramik Lantai 40x40 Putih', 'Keramik & Lantai', 'dus', 52000, 65000, 80, 15, '8998001100011', 61000, 20],
            ['Keramik Dinding 25x40', 'Keramik & Lantai', 'dus', 58000, 72000, 55, 12, '8998001100028', null, null],

            ['Paku 5cm', 'Alat & Lainnya', 'kg', 16000, 22000, 25.5, 5, null, null, null],
            ['Roll Kabel NYM 2x1.5', 'Alat & Lainnya', 'roll', 320000, 385000, 12, 3, null, null, null],
        ];

        $seq = 0;
        foreach ($items as $i) {
            [$name, $catName, $unitName, $cost, $sell, $stock, $min, $barcode, $wPrice, $wMin] = $i;
            $seq++;

            $product = Product::updateOrCreate(
                ['name' => $name],
                [
                    'sku' => 'BJ-'.str_pad((string) $seq, 4, '0', STR_PAD_LEFT),
                    'barcode' => $barcode,
                    'category_id' => $cat[$catName],
                    'unit_id' => $unit[$unitName],
                    'cost_price' => $cost,
                    'sell_price' => $sell,
                    'wholesale_price' => $wPrice,
                    'wholesale_min_qty' => $wMin,
                    'stock' => $stock,
                    'min_stock' => $min,
                    'is_active' => true,
                ]
            );

            if ($product->stockMovements()->doesntExist()) {
                $product->stockMovements()->create([
                    'type' => StockMovement::TYPE_INITIAL,
                    'qty_change' => $stock,
                    'stock_after' => $stock,
                    'note' => 'Stok awal',
                ]);
            }
        }
    }
}
