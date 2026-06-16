<?php

namespace App\Services;

use App\Models\Product;
use App\Models\Purchase;
use App\Models\StockMovement;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class PurchaseService
{
    public function __construct(private StockService $stock) {}

    /**
     * Record a stock purchase: adds stock, refreshes cost price, writes movements.
     *
     * @param  array{supplier_id:int, ref_no?:string|null, note?:string|null, purchased_at?:string|null, items: array<int, array{product_id:int, qty:float|int, cost_price:int}>}  $data
     */
    public function create(User $user, array $data): Purchase
    {
        $items = $data['items'] ?? [];
        if (empty($items)) {
            throw ValidationException::withMessages(['items' => 'Tambahkan minimal satu barang.']);
        }

        return DB::transaction(function () use ($user, $data, $items) {
            $purchase = Purchase::create([
                'ref_no' => ($data['ref_no'] ?? null) ?: $this->generateRefNo(),
                'supplier_id' => $data['supplier_id'],
                'user_id' => $user->id,
                'total' => 0,
                'note' => $data['note'] ?? null,
                'purchased_at' => $data['purchased_at'] ?? now()->toDateString(),
            ]);

            $total = 0;

            foreach ($items as $line) {
                $product = Product::query()->lockForUpdate()->findOrFail($line['product_id']);
                $qty = round((float) $line['qty'], 2);
                $cost = (int) $line['cost_price'];
                $subtotal = (int) round($cost * $qty);
                $total += $subtotal;

                $purchase->items()->create([
                    'product_id' => $product->id,
                    'qty' => $qty,
                    'cost_price' => $cost,
                    'subtotal' => $subtotal,
                ]);

                // Add stock + record movement.
                $this->stock->recordMovement(
                    $product,
                    $qty,
                    StockMovement::TYPE_PURCHASE,
                    refType: Purchase::class,
                    refId: $purchase->id,
                    note: 'Pembelian '.$purchase->ref_no,
                );

                // Refresh cost price to the latest purchase price.
                $product->update(['cost_price' => $cost]);
            }

            $purchase->update(['total' => $total]);

            return $purchase;
        });
    }

    private function generateRefNo(): string
    {
        $prefix = 'PB-'.now()->format('Ymd').'-';

        $last = Purchase::query()
            ->where('ref_no', 'like', $prefix.'%')
            ->lockForUpdate()
            ->orderByDesc('ref_no')
            ->value('ref_no');

        $next = $last ? ((int) substr($last, -4)) + 1 : 1;

        return $prefix.str_pad((string) $next, 4, '0', STR_PAD_LEFT);
    }
}
