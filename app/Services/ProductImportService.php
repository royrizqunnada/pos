<?php

namespace App\Services;

use App\Models\Category;
use App\Models\Product;
use App\Models\StockMovement;
use App\Models\Unit;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use OpenSpout\Reader\CSV\Reader as CsvReader;
use OpenSpout\Reader\XLSX\Reader as XlsxReader;

class ProductImportService
{
    public function __construct(private StockService $stock) {}

    /** Header aliases (normalized) -> canonical field. */
    private array $headerMap = [
        'nama' => 'name', 'nama_barang' => 'name', 'name' => 'name',
        'kategori' => 'category', 'category' => 'category',
        'satuan' => 'unit', 'unit' => 'unit',
        'sku' => 'sku', 'kode' => 'sku',
        'barcode' => 'barcode',
        'harga_modal' => 'cost_price', 'modal' => 'cost_price', 'cost_price' => 'cost_price',
        'harga_jual' => 'sell_price', 'jual' => 'sell_price', 'harga' => 'sell_price', 'sell_price' => 'sell_price',
        'harga_grosir' => 'wholesale_price', 'grosir' => 'wholesale_price',
        'min_qty_grosir' => 'wholesale_min_qty', 'qty_grosir' => 'wholesale_min_qty', 'minimal_grosir' => 'wholesale_min_qty',
        'stok' => 'stock', 'stock' => 'stock', 'jumlah' => 'stock',
        'stok_minimum' => 'min_stock', 'min_stok' => 'min_stock', 'stok_min' => 'min_stock',
    ];

    /**
     * Import products from an uploaded spreadsheet (xlsx/csv).
     *
     * @return array{imported:int, created:int, updated:int}
     */
    public function import(string $path, string $extension): array
    {
        $rows = $this->readRows($path, $extension);

        if (empty($rows)) {
            throw ValidationException::withMessages(['file' => 'File kosong atau tidak ada baris data.']);
        }

        // Header row -> field map.
        $header = array_map(fn ($h) => $this->headerMap[$this->normalize($h)] ?? null, array_shift($rows));

        if (! in_array('name', $header, true)) {
            throw ValidationException::withMessages(['file' => 'Kolom "nama" wajib ada di baris pertama (header).']);
        }

        $errors = [];
        $parsed = [];

        foreach ($rows as $i => $raw) {
            $line = $i + 2; // header is line 1
            $data = $this->mapRow($header, $raw);

            if ($this->isEmptyRow($data)) {
                continue;
            }

            if (($data['name'] ?? '') === '') {
                $errors[] = "Baris {$line}: nama barang kosong.";

                continue;
            }
            if (! is_numeric($data['sell_price'] ?? null)) {
                $errors[] = "Baris {$line}: harga jual tidak valid.";

                continue;
            }

            $parsed[] = $data;
        }

        if (! empty($errors)) {
            throw ValidationException::withMessages(['file' => array_slice($errors, 0, 15)]);
        }

        if (empty($parsed)) {
            throw ValidationException::withMessages(['file' => 'Tidak ada baris data yang bisa diimpor.']);
        }

        return DB::transaction(function () use ($parsed) {
            $created = 0;
            $updated = 0;
            $catCache = [];
            $unitCache = [];

            foreach ($parsed as $data) {
                $categoryId = $this->resolveCategory($data['category'] ?? '', $catCache);
                $unitId = $this->resolveUnit($data['unit'] ?? '', $unitCache);

                $attributes = array_filter([
                    'category_id' => $categoryId,
                    'unit_id' => $unitId,
                    'cost_price' => $this->toInt($data['cost_price'] ?? null),
                    'sell_price' => $this->toInt($data['sell_price'] ?? null),
                    'wholesale_price' => isset($data['wholesale_price']) && $data['wholesale_price'] !== '' ? $this->toInt($data['wholesale_price']) : null,
                    'wholesale_min_qty' => isset($data['wholesale_min_qty']) && $data['wholesale_min_qty'] !== '' ? $this->toFloat($data['wholesale_min_qty']) : null,
                    'min_stock' => $this->toFloat($data['min_stock'] ?? 0),
                    'barcode' => ($data['barcode'] ?? '') !== '' ? $data['barcode'] : null,
                ], fn ($v) => $v !== null);

                // Match by SKU when given, otherwise by name.
                $sku = ($data['sku'] ?? '') !== '' ? $data['sku'] : null;
                $lookup = $sku ? ['sku' => $sku] : ['name' => $data['name']];

                $product = Product::where($lookup)->first();

                if ($product) {
                    $product->fill($attributes)->save();
                    $updated++;
                } else {
                    $product = Product::create(array_merge($attributes, [
                        'name' => $data['name'],
                        'sku' => $sku,
                        'is_active' => true,
                        'stock' => 0,
                    ]));
                    $created++;
                }

                $qty = $this->toFloat($data['stock'] ?? 0);
                if ($qty > 0) {
                    $this->stock->recordMovement(
                        $product,
                        $qty,
                        $product->wasRecentlyCreated ? StockMovement::TYPE_INITIAL : StockMovement::TYPE_ADJUSTMENT,
                        note: 'Impor Excel',
                    );
                }
            }

            return ['imported' => $created + $updated, 'created' => $created, 'updated' => $updated];
        });
    }

    private function readRows(string $path, string $extension): array
    {
        $reader = strtolower($extension) === 'csv' ? new CsvReader : new XlsxReader;
        $reader->open($path);

        $rows = [];
        foreach ($reader->getSheetIterator() as $sheet) {
            foreach ($sheet->getRowIterator() as $row) {
                $rows[] = array_map(fn ($c) => is_string($c) ? trim($c) : $c, $row->toArray());
            }
            break; // only the first sheet
        }
        $reader->close();

        return $rows;
    }

    private function mapRow(array $header, array $raw): array
    {
        $out = [];
        foreach ($header as $idx => $field) {
            if ($field === null) {
                continue;
            }
            $value = $raw[$idx] ?? '';
            $out[$field] = is_string($value) ? trim($value) : $value;
        }

        return $out;
    }

    private function isEmptyRow(array $data): bool
    {
        foreach ($data as $v) {
            if ($v !== '' && $v !== null) {
                return false;
            }
        }

        return true;
    }

    private function resolveCategory(string $name, array &$cache): int
    {
        $name = $name !== '' ? $name : 'Lainnya';
        $key = mb_strtolower($name);

        return $cache[$key] ??= Category::firstOrCreate(['name' => $name], ['color' => '#6E665A'])->id;
    }

    private function resolveUnit(string $name, array &$cache): int
    {
        $name = $name !== '' ? $name : 'pcs';
        $key = mb_strtolower($name);

        return $cache[$key] ??= Unit::firstOrCreate(['name' => $name])->id;
    }

    private function normalize(string $h): string
    {
        return str_replace([' ', '-'], '_', mb_strtolower(trim($h)));
    }

    private function toInt(mixed $v): int
    {
        if ($v === null || $v === '') {
            return 0;
        }

        return (int) round((float) preg_replace('/[^0-9.\-]/', '', str_replace(['.', ','], ['', '.'], (string) $v)));
    }

    private function toFloat(mixed $v): float
    {
        if ($v === null || $v === '') {
            return 0.0;
        }
        if (is_int($v) || is_float($v)) {
            return (float) $v;
        }
        $s = trim((string) $v);
        // Indonesian style: "1.500,5" -> 1500.5 ; "1,5" -> 1.5
        if (str_contains($s, ',')) {
            $s = str_replace('.', '', $s);
            $s = str_replace(',', '.', $s);
        }

        return (float) preg_replace('/[^0-9.\-]/', '', $s);
    }
}
