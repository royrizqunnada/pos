<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreSaleRequest;
use App\Models\ActivityLog;
use App\Models\Category;
use App\Models\Customer;
use App\Models\Product;
use App\Models\Sale;
use App\Models\Setting;
use App\Services\SaleService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SaleController extends Controller
{
    public function __construct(private SaleService $sales) {}

    public function index(): Response
    {
        $products = Product::query()
            ->active()
            ->with(['category:id,name,color', 'unit:id,name'])
            ->orderBy('name')
            ->get()
            ->map(fn (Product $p) => [
                'id' => $p->id,
                'name' => $p->name,
                'barcode' => $p->barcode,
                'sku' => $p->sku,
                'category_id' => $p->category_id,
                'category' => $p->category ? ['id' => $p->category->id, 'name' => $p->category->name, 'color' => $p->category->color] : null,
                'unit_name' => $p->unit?->name ?? '',
                'sell_price' => (int) $p->sell_price,
                'wholesale_price' => $p->wholesale_price !== null ? (int) $p->wholesale_price : null,
                'wholesale_min_qty' => $p->wholesale_min_qty !== null ? (float) $p->wholesale_min_qty : null,
                'stock' => (float) $p->stock,
            ]);

        return Inertia::render('kasir/index', [
            'products' => $products,
            'categories' => Category::orderBy('name')->get(['id', 'name', 'color']),
            'customers' => Customer::orderBy('name')->get(['id', 'name', 'debt']),
            'receipt' => session('receipt'),
        ]);
    }

    public function store(StoreSaleRequest $request): RedirectResponse
    {
        $sale = $this->sales->create($request->user(), $request->validated());

        ActivityLog::record(
            'penjualan.buat',
            "Membuat penjualan {$sale->invoice_no} (".($sale->payment_method === Sale::PAYMENT_UTANG ? 'utang' : 'tunai').') senilai Rp'.number_format($sale->total, 0, ',', '.').'.',
            $sale,
            ['total' => (int) $sale->total, 'payment_method' => $sale->payment_method],
        );

        return redirect()
            ->route('kasir.index')
            ->with('success', "Transaksi {$sale->invoice_no} berhasil.")
            ->with('receipt', $this->receiptData($sale));
    }

    /** Sales history with date / status / search filters. */
    public function history(Request $request): Response
    {
        $sales = Sale::query()
            ->with(['customer:id,name', 'user:id,name'])
            ->when($request->date('from'), fn ($q, $d) => $q->where('created_at', '>=', $d->startOfDay()))
            ->when($request->date('to'), fn ($q, $d) => $q->where('created_at', '<=', $d->endOfDay()))
            ->when($request->string('status')->toString(), function ($q, $status) {
                if ($status === 'batal') {
                    $q->whereNotNull('voided_at');
                } else {
                    $q->whereNull('voided_at')->where('status', $status);
                }
            })
            ->when($request->string('search')->toString(), function ($q, $search) {
                $q->where(function ($q) use ($search) {
                    $q->where('invoice_no', 'like', "%{$search}%")
                        ->orWhereHas('customer', fn ($q) => $q->where('name', 'like', "%{$search}%"));
                });
            })
            ->latest()
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('penjualan/index', [
            'sales' => $sales->through(fn (Sale $s) => [
                'id' => $s->id,
                'invoice_no' => $s->invoice_no,
                'created_at' => $s->created_at->toIso8601String(),
                'cashier' => $s->user?->name,
                'customer' => $s->customer?->name ?? 'Umum',
                'payment_method' => $s->payment_method,
                'status' => $s->status,
                'total' => (int) $s->total,
                'voided' => $s->isVoided(),
            ]),
            'filters' => [
                'from' => $request->string('from')->toString() ?: null,
                'to' => $request->string('to')->toString() ?: null,
                'status' => $request->string('status')->toString() ?: null,
                'search' => $request->string('search')->toString(),
            ],
        ]);
    }

    public function show(Request $request, Sale $sale): Response
    {
        return Inertia::render('penjualan/show', [
            'sale' => [
                'id' => $sale->id,
                'invoice_no' => $sale->invoice_no,
                'created_at' => $sale->created_at->toIso8601String(),
                'voided' => $sale->isVoided(),
                'voided_at' => $sale->voided_at?->toIso8601String(),
                'void_reason' => $sale->void_reason,
            ],
            'receipt' => $this->receiptData($sale),
            'can_void' => $request->user()->isPemilik() && ! $sale->isVoided(),
        ]);
    }

    public function void(Request $request, Sale $sale): RedirectResponse
    {
        abort_unless($request->user()->isPemilik(), 403);

        $request->validate(['reason' => ['nullable', 'string', 'max:255']]);

        $this->sales->void($sale, $request->user(), $request->input('reason'));

        ActivityLog::record(
            'penjualan.batal',
            "Membatalkan penjualan {$sale->invoice_no}".($request->input('reason') ? ' — '.$request->input('reason') : '').'.',
            $sale,
            ['total' => (int) $sale->total, 'reason' => $request->input('reason')],
        );

        return back()->with('success', "Transaksi {$sale->invoice_no} berhasil dibatalkan, stok dikembalikan.");
    }

    /** Build the printable receipt payload for a sale. */
    private function receiptData(Sale $sale): array
    {
        $sale->load(['items', 'customer:id,name', 'user:id,name']);
        $store = Setting::current();

        return [
            'invoice_no' => $sale->invoice_no,
            'created_at' => $sale->created_at->toIso8601String(),
            'cashier' => $sale->user?->name,
            'customer' => $sale->customer?->name,
            'items' => $sale->items->map(fn ($i) => [
                'name' => $i->product_name,
                'unit' => $i->unit_name,
                'qty' => (float) $i->qty,
                'price' => (int) $i->price,
                'discount' => (int) $i->discount,
                'subtotal' => (int) $i->subtotal,
            ]),
            'subtotal' => (int) $sale->subtotal,
            'discount' => (int) $sale->discount,
            'total' => (int) $sale->total,
            'payment_method' => $sale->payment_method,
            'paid_amount' => (int) $sale->paid_amount,
            'change_amount' => (int) $sale->change_amount,
            'status' => $sale->status,
            'store' => [
                'name' => $store->store_name,
                'address' => $store->store_address,
                'phone' => $store->store_phone,
                'footer' => $store->receipt_footer,
            ],
        ];
    }
}
