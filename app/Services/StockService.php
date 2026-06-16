<?php

namespace App\Services;

use App\Models\Product;
use App\Models\StockMovement;
use Illuminate\Support\Facades\DB;

class StockService
{
    /**
     * Apply a stock change to a product and record the movement.
     *
     * Positive $qtyChange increases stock (purchase, positive adjustment),
     * negative decreases it (sale, negative adjustment). Must be called
     * inside a database transaction by the caller.
     */
    public function recordMovement(
        Product $product,
        float $qtyChange,
        string $type,
        ?string $refType = null,
        ?int $refId = null,
        ?string $note = null,
    ): StockMovement {
        // Lock the row to avoid race conditions on concurrent stock changes.
        $product = Product::query()->lockForUpdate()->findOrFail($product->id);

        $newStock = round((float) $product->stock + $qtyChange, 2);

        $product->stock = $newStock;
        $product->save();

        return $product->stockMovements()->create([
            'type' => $type,
            'qty_change' => $qtyChange,
            'stock_after' => $newStock,
            'ref_type' => $refType,
            'ref_id' => $refId,
            'note' => $note,
        ]);
    }

    /** Quick restock (manual "tambah stok cepat"). */
    public function addStock(Product $product, float $qty, ?string $note = null): StockMovement
    {
        return DB::transaction(fn () => $this->recordMovement(
            $product,
            abs($qty),
            StockMovement::TYPE_ADJUSTMENT,
            note: $note ?? 'Tambah stok cepat',
        ));
    }

    /**
     * Set the stock to an absolute target value (manual adjustment / opname),
     * recording the difference as the movement.
     */
    public function adjustTo(Product $product, float $targetStock, string $reason): StockMovement
    {
        return DB::transaction(function () use ($product, $targetStock, $reason) {
            $fresh = Product::query()->lockForUpdate()->findOrFail($product->id);
            $diff = round($targetStock - (float) $fresh->stock, 2);

            return $this->recordMovement(
                $fresh,
                $diff,
                StockMovement::TYPE_ADJUSTMENT,
                note: $reason,
            );
        });
    }
}
