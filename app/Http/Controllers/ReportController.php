<?php

namespace App\Http\Controllers;

use App\Services\ReportService;
use Carbon\CarbonImmutable;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ReportController extends Controller
{
    public function __construct(private ReportService $reports) {}

    public function index(Request $request): Response
    {
        [$from, $to] = $this->resolveRange($request);
        $isOwner = $request->user()->isPemilik();

        return Inertia::render('laporan/index', [
            'filters' => ['from' => $from, 'to' => $to],
            'summary' => $this->reports->salesSummary($from, $to),
            'profit' => $isOwner ? $this->reports->grossProfit($from, $to) : null,
            'by_category' => $this->reports->salesByCategory($from, $to),
            'top_products' => $this->reports->topProducts($from, $to, 10),
            'receivables' => $this->reports->receivables(),
            'inventory_value' => $isOwner ? $this->reports->inventoryValue() : null,
            'is_owner' => $isOwner,
        ]);
    }

    public function export(Request $request): StreamedResponse
    {
        [$from, $to] = $this->resolveRange($request);
        $type = $request->string('type')->toString();
        $isOwner = $request->user()->isPemilik();

        [$filename, $header, $rows] = match ($type) {
            'terlaris' => [
                'barang-terlaris',
                ['Barang', 'Satuan', 'Qty Terjual', 'Total'],
                array_map(fn ($r) => [$r['name'], $r['unit'], $r['qty'], $r['total']], $this->reports->topProducts($from, $to, 100)),
            ],
            'kategori' => [
                'penjualan-per-kategori',
                ['Kategori', 'Qty', 'Total'],
                array_map(fn ($r) => [$r['name'], $r['qty'], $r['total']], $this->reports->salesByCategory($from, $to)),
            ],
            'piutang' => [
                'laporan-piutang',
                ['Pelanggan', 'Telepon', 'Utang'],
                array_map(fn ($r) => [$r['name'], $r['phone'], $r['debt']], $this->reports->receivables()['customers']),
            ],
            default => $this->salesRecapExport($from, $to, $isOwner),
        };

        return $this->streamCsv("{$filename}-{$from}-sd-{$to}.csv", $header, $rows);
    }

    private function salesRecapExport(string $from, string $to, bool $isOwner): array
    {
        $s = $this->reports->salesSummary($from, $to);
        $rows = [
            ['Omzet', $s['omzet']],
            ['Jumlah Transaksi', $s['transaksi']],
            ['Rata-rata per Transaksi', $s['rata_rata']],
            ['Total Diskon', $s['diskon']],
        ];

        if ($isOwner) {
            $p = $this->reports->grossProfit($from, $to);
            $rows[] = ['Modal (HPP)', $p['modal']];
            $rows[] = ['Laba Kotor', $p['laba_kotor']];
        }

        return ['rekap-penjualan', ['Keterangan', 'Nilai'], $rows];
    }

    private function streamCsv(string $filename, array $header, array $rows): StreamedResponse
    {
        return response()->streamDownload(function () use ($header, $rows) {
            $out = fopen('php://output', 'w');
            fputcsv($out, $header);
            foreach ($rows as $row) {
                fputcsv($out, $row);
            }
            fclose($out);
        }, $filename, ['Content-Type' => 'text/csv']);
    }

    /** @return array{0: string, 1: string} */
    private function resolveRange(Request $request): array
    {
        $from = $request->date('from') ?? CarbonImmutable::today()->startOfMonth();
        $to = $request->date('to') ?? CarbonImmutable::today();

        return [
            CarbonImmutable::parse($from)->toDateString(),
            CarbonImmutable::parse($to)->toDateString(),
        ];
    }
}
