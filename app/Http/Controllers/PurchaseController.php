<?php

namespace App\Http\Controllers;

use App\Http\Requests\StorePurchaseRequest;
use App\Models\Product;
use App\Models\Purchase;
use App\Models\Supplier;
use App\Services\PurchaseService;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class PurchaseController extends Controller
{
    public function __construct(private PurchaseService $purchases) {}

    public function index(): Response
    {
        $purchases = Purchase::query()
            ->with('supplier:id,name')
            ->withCount('items')
            ->latest('purchased_at')
            ->latest('id')
            ->paginate(15);

        return Inertia::render('pembelian/index', [
            'purchases' => $purchases->through(fn (Purchase $p) => [
                'id' => $p->id,
                'ref_no' => $p->ref_no,
                'supplier' => $p->supplier?->name,
                'total' => (int) $p->total,
                'items_count' => $p->items_count,
                'purchased_at' => $p->purchased_at->toDateString(),
            ]),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('pembelian/create', [
            'suppliers' => Supplier::orderBy('name')->get(['id', 'name']),
            'products' => Product::with('unit:id,name')->orderBy('name')->get(['id', 'name', 'cost_price', 'unit_id'])
                ->map(fn (Product $p) => [
                    'id' => $p->id,
                    'name' => $p->name,
                    'cost_price' => (int) $p->cost_price,
                    'unit_name' => $p->unit?->name ?? '',
                ]),
        ]);
    }

    public function store(StorePurchaseRequest $request): RedirectResponse
    {
        $purchase = $this->purchases->create($request->user(), $request->validated());

        return redirect()->route('pembelian.index')->with('success', "Pembelian {$purchase->ref_no} berhasil, stok diperbarui.");
    }

    public function show(Purchase $purchase): Response
    {
        $purchase->load(['supplier:id,name', 'user:id,name', 'items.product:id,name,unit_id']);

        return Inertia::render('pembelian/show', [
            'purchase' => [
                'id' => $purchase->id,
                'ref_no' => $purchase->ref_no,
                'supplier' => $purchase->supplier?->name,
                'cashier' => $purchase->user?->name,
                'note' => $purchase->note,
                'total' => (int) $purchase->total,
                'purchased_at' => $purchase->purchased_at->toDateString(),
                'items' => $purchase->items->map(fn ($i) => [
                    'name' => $i->product?->name,
                    'qty' => (float) $i->qty,
                    'cost_price' => (int) $i->cost_price,
                    'subtotal' => (int) $i->subtotal,
                ]),
            ],
        ]);
    }
}
