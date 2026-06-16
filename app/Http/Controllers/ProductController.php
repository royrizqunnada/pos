<?php

namespace App\Http\Controllers;

use App\Http\Requests\AddStockRequest;
use App\Http\Requests\AdjustStockRequest;
use App\Http\Requests\StoreProductRequest;
use App\Http\Requests\UpdateProductRequest;
use App\Models\Category;
use App\Models\Product;
use App\Models\StockMovement;
use App\Models\Unit;
use App\Services\StockService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class ProductController extends Controller
{
    public function __construct(private StockService $stock) {}

    public function index(Request $request): Response
    {
        $this->authorize('viewAny', Product::class);

        $canSeeCost = $request->user()->can('view-cost-price');

        $query = Product::query()
            ->with(['category', 'unit'])
            ->when($request->string('search')->toString(), function ($q, $search) {
                $q->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                        ->orWhere('sku', 'like', "%{$search}%")
                        ->orWhere('barcode', 'like', "%{$search}%");
                });
            })
            ->when($request->integer('category_id'), fn ($q, $id) => $q->where('category_id', $id))
            ->when($request->boolean('low_stock'), fn ($q) => $q->lowStock())
            ->orderBy('name');

        $products = $query->paginate(15)->withQueryString()
            ->through(fn (Product $p) => $this->transform($p, $canSeeCost));

        // Summary cards
        $inventoryValue = $canSeeCost
            ? (int) Product::query()->selectRaw('COALESCE(SUM(stock * cost_price), 0) as v')->value('v')
            : null;

        return Inertia::render('barang/index', [
            'products' => $products,
            'categories' => Category::orderBy('name')->get(['id', 'name', 'color']),
            'units' => Unit::orderBy('name')->get(['id', 'name']),
            'filters' => [
                'search' => $request->string('search')->toString(),
                'category_id' => $request->integer('category_id') ?: null,
                'low_stock' => $request->boolean('low_stock'),
            ],
            'summary' => [
                'total_products' => Product::count(),
                'low_stock_count' => Product::lowStock()->count(),
                'inventory_value' => $inventoryValue,
            ],
            'can' => [
                'manage' => $request->user()->can('create', Product::class),
                'view_cost' => $canSeeCost,
            ],
        ]);
    }

    public function store(StoreProductRequest $request): RedirectResponse
    {
        $data = $request->validated();

        DB::transaction(function () use ($data) {
            $product = Product::create($data);

            if ((float) $product->stock > 0) {
                $product->stockMovements()->create([
                    'type' => StockMovement::TYPE_INITIAL,
                    'qty_change' => $product->stock,
                    'stock_after' => $product->stock,
                    'note' => 'Stok awal',
                ]);
            }
        });

        return redirect()->route('barang.index')->with('success', 'Barang berhasil ditambahkan.');
    }

    public function update(UpdateProductRequest $request, Product $product): RedirectResponse
    {
        // Stock is intentionally not editable here; use tambah stok / penyesuaian.
        $product->update($request->validated());

        return redirect()->route('barang.index')->with('success', 'Barang berhasil diperbarui.');
    }

    public function destroy(Product $product): RedirectResponse
    {
        $this->authorize('delete', $product);

        if ($product->saleItems()->exists()) {
            return back()->with('error', 'Barang tidak dapat dihapus karena sudah memiliki riwayat penjualan. Nonaktifkan saja.');
        }

        $product->delete();

        return redirect()->route('barang.index')->with('success', 'Barang berhasil dihapus.');
    }

    public function addStock(AddStockRequest $request, Product $product): RedirectResponse
    {
        $this->stock->addStock($product, (float) $request->validated('qty'), $request->validated('note'));

        return back()->with('success', 'Stok berhasil ditambahkan.');
    }

    public function adjust(AdjustStockRequest $request, Product $product): RedirectResponse
    {
        $this->stock->adjustTo($product, (float) $request->validated('stock'), $request->validated('reason'));

        return back()->with('success', 'Stok berhasil disesuaikan.');
    }

    /** Shape a product for the frontend, hiding cost data from cashiers. */
    private function transform(Product $p, bool $canSeeCost): array
    {
        return [
            'id' => $p->id,
            'sku' => $p->sku,
            'barcode' => $p->barcode,
            'name' => $p->name,
            'category' => $p->category ? ['id' => $p->category->id, 'name' => $p->category->name, 'color' => $p->category->color] : null,
            'unit' => $p->unit ? ['id' => $p->unit->id, 'name' => $p->unit->name] : null,
            'category_id' => $p->category_id,
            'unit_id' => $p->unit_id,
            'sell_price' => (int) $p->sell_price,
            'wholesale_price' => $p->wholesale_price !== null ? (int) $p->wholesale_price : null,
            'wholesale_min_qty' => $p->wholesale_min_qty !== null ? (float) $p->wholesale_min_qty : null,
            'stock' => (float) $p->stock,
            'min_stock' => (float) $p->min_stock,
            'is_active' => $p->is_active,
            'is_low_stock' => $p->isLowStock(),
            'cost_price' => $canSeeCost ? (int) $p->cost_price : null,
        ];
    }
}
