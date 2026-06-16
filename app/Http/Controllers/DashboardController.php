<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use App\Models\Product;
use App\Models\Sale;
use App\Services\ReportService;
use Carbon\CarbonImmutable;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __construct(private ReportService $reports) {}

    public function index(Request $request): Response
    {
        $isOwner = $request->user()->isPemilik();
        $today = CarbonImmutable::today()->toDateString();

        $todaySummary = $this->reports->salesSummary($today, $today);

        $recentSales = Sale::query()
            ->with('customer:id,name')
            ->latest()
            ->limit(8)
            ->get()
            ->map(fn (Sale $s) => [
                'id' => $s->id,
                'invoice_no' => $s->invoice_no,
                'customer' => $s->customer?->name ?? 'Umum',
                'total' => (int) $s->total,
                'status' => $s->status,
                'created_at' => $s->created_at->toIso8601String(),
            ]);

        return Inertia::render('dashboard', [
            'kpi' => [
                'omzet_hari_ini' => $todaySummary['omzet'],
                'transaksi_hari_ini' => $todaySummary['transaksi'],
                'total_piutang' => (int) Customer::sum('debt'),
                'stok_menipis' => Product::lowStock()->count(),
                // Owner-only.
                'laba_hari_ini' => $isOwner ? $this->reports->grossProfit($today, $today)['laba_kotor'] : null,
            ],
            'chart' => $this->reports->dailyRevenue(7),
            'top_products' => $this->reports->topProducts(
                CarbonImmutable::today()->subDays(30)->toDateString(),
                $today,
                5
            ),
            'recent_sales' => $recentSales,
            'is_owner' => $isOwner,
        ]);
    }
}
