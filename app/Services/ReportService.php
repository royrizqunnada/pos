<?php

namespace App\Services;

use App\Models\Customer;
use App\Models\Product;
use App\Models\Sale;
use App\Models\SaleItem;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;

class ReportService
{
    /** Sales recap within an inclusive date range. */
    public function salesSummary(string $from, string $to): array
    {
        $row = Sale::query()
            ->notVoided()
            ->whereBetween('created_at', $this->range($from, $to))
            ->selectRaw('COUNT(*) as trx, COALESCE(SUM(total), 0) as omzet, COALESCE(SUM(discount), 0) as diskon')
            ->first();

        $trx = (int) $row->trx;
        $omzet = (int) $row->omzet;

        return [
            'omzet' => $omzet,
            'transaksi' => $trx,
            'rata_rata' => $trx > 0 ? (int) round($omzet / $trx) : 0,
            'diskon' => (int) $row->diskon,
        ];
    }

    /** Cost of goods sold for sales in range (qty * current cost price). */
    public function cogs(string $from, string $to): int
    {
        return (int) SaleItem::query()
            ->join('sales', 'sales.id', '=', 'sale_items.sale_id')
            ->join('products', 'products.id', '=', 'sale_items.product_id')
            ->whereBetween('sales.created_at', $this->range($from, $to))
            ->whereNull('sales.voided_at')
            ->sum(DB::raw('sale_items.qty * products.cost_price'));
    }

    /** Gross profit = revenue - COGS. */
    public function grossProfit(string $from, string $to): array
    {
        $omzet = $this->salesSummary($from, $to)['omzet'];
        $modal = $this->cogs($from, $to);

        return [
            'omzet' => $omzet,
            'modal' => $modal,
            'laba_kotor' => $omzet - $modal,
        ];
    }

    /** Revenue grouped by product category. */
    public function salesByCategory(string $from, string $to): array
    {
        return SaleItem::query()
            ->join('sales', 'sales.id', '=', 'sale_items.sale_id')
            ->join('products', 'products.id', '=', 'sale_items.product_id')
            ->leftJoin('categories', 'categories.id', '=', 'products.category_id')
            ->whereBetween('sales.created_at', $this->range($from, $to))
            ->whereNull('sales.voided_at')
            ->groupBy('categories.id', 'categories.name', 'categories.color')
            ->selectRaw('categories.name as name, categories.color as color, SUM(sale_items.subtotal) as total, SUM(sale_items.qty) as qty')
            ->orderByDesc('total')
            ->get()
            ->map(fn ($r) => [
                'name' => $r->name ?? 'Tanpa Kategori',
                'color' => $r->color ?? '#6E665A',
                'total' => (int) $r->total,
                'qty' => (float) $r->qty,
            ])
            ->all();
    }

    /** Best selling products by quantity. */
    public function topProducts(string $from, string $to, int $limit = 10): array
    {
        return SaleItem::query()
            ->join('sales', 'sales.id', '=', 'sale_items.sale_id')
            ->whereBetween('sales.created_at', $this->range($from, $to))
            ->whereNull('sales.voided_at')
            ->groupBy('sale_items.product_id', 'sale_items.product_name', 'sale_items.unit_name')
            ->selectRaw('sale_items.product_name as name, sale_items.unit_name as unit, SUM(sale_items.qty) as qty, SUM(sale_items.subtotal) as total')
            ->orderByDesc('qty')
            ->limit($limit)
            ->get()
            ->map(fn ($r) => [
                'name' => $r->name,
                'unit' => $r->unit,
                'qty' => (float) $r->qty,
                'total' => (int) $r->total,
            ])
            ->all();
    }

    /** Daily revenue for the last N days (inclusive of today). */
    public function dailyRevenue(int $days = 7): array
    {
        $start = CarbonImmutable::today()->subDays($days - 1);

        $rows = Sale::query()
            ->notVoided()
            ->where('created_at', '>=', $start->startOfDay())
            ->selectRaw('CAST(created_at AS DATE) as d, SUM(total) as total')
            ->groupBy('d')
            ->pluck('total', 'd');

        $out = [];
        for ($i = 0; $i < $days; $i++) {
            $day = $start->addDays($i);
            $key = $day->format('Y-m-d');
            $out[] = [
                'date' => $key,
                'label' => $day->translatedFormat('d M'),
                'total' => (int) ($rows[$key] ?? 0),
            ];
        }

        return $out;
    }

    /** Outstanding receivables (customers with debt). */
    public function receivables(): array
    {
        $customers = Customer::withDebt()
            ->orderByDesc('debt')
            ->get(['id', 'name', 'phone', 'debt'])
            ->map(fn (Customer $c) => [
                'id' => $c->id,
                'name' => $c->name,
                'phone' => $c->phone,
                'debt' => (int) $c->debt,
            ]);

        return [
            'total' => (int) Customer::sum('debt'),
            'customers' => $customers->all(),
        ];
    }

    /** Total inventory value at cost. */
    public function inventoryValue(): int
    {
        return (int) Product::query()->selectRaw('COALESCE(SUM(stock * cost_price), 0) as v')->value('v');
    }

    /** @return array{0: CarbonImmutable, 1: CarbonImmutable} */
    private function range(string $from, string $to): array
    {
        return [
            CarbonImmutable::parse($from)->startOfDay(),
            CarbonImmutable::parse($to)->endOfDay(),
        ];
    }
}
