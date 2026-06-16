<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreSaleRequest;
use App\Models\Category;
use App\Models\Customer;
use App\Models\Product;
use App\Models\Sale;
use App\Models\Setting;
use App\Services\SaleService;
use Illuminate\Http\RedirectResponse;
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

        return redirect()
            ->route('kasir.index')
            ->with('success', "Transaksi {$sale->invoice_no} berhasil.")
            ->with('receipt', $this->receiptData($sale));
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
