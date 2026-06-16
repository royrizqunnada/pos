<?php

namespace App\Services;

use App\Models\Customer;
use App\Models\Product;
use App\Models\Sale;
use App\Models\StockMovement;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class SaleService
{
    public function __construct(private StockService $stock) {}

    /**
     * Create a sale transaction.
     *
     * @param  array{items: array<int, array{product_id:int, qty:float|int}>, customer_id?: int|null, payment_method: string, paid_amount?: int, discount?: int, note?: string|null}  $data
     */
    public function create(User $cashier, array $data): Sale
    {
        $items = $data['items'] ?? [];
        if (empty($items)) {
            throw ValidationException::withMessages(['items' => 'Keranjang masih kosong.']);
        }

        $paymentMethod = $data['payment_method'];
        $customerId = $data['customer_id'] ?? null;
        $discount = (int) ($data['discount'] ?? 0);
        $paidAmount = (int) ($data['paid_amount'] ?? 0);

        if ($paymentMethod === Sale::PAYMENT_UTANG && ! $customerId) {
            throw ValidationException::withMessages([
                'customer_id' => 'Pelanggan wajib dipilih untuk transaksi utang.',
            ]);
        }

        return DB::transaction(function () use ($cashier, $items, $paymentMethod, $customerId, $discount, $paidAmount, $data) {
            $subtotal = 0;
            $lineItems = [];

            foreach ($items as $line) {
                $product = Product::query()->lockForUpdate()->find($line['product_id']);
                if (! $product) {
                    throw ValidationException::withMessages(['items' => 'Salah satu barang tidak ditemukan.']);
                }

                $qty = round((float) $line['qty'], 2);
                if ($qty <= 0) {
                    throw ValidationException::withMessages(['items' => "Jumlah {$product->name} tidak valid."]);
                }

                if ($qty > (float) $product->stock) {
                    throw ValidationException::withMessages([
                        'items' => "Stok {$product->name} tidak mencukupi (tersisa {$product->stock}).",
                    ]);
                }

                $price = $product->priceForQty($qty);
                $lineSubtotal = (int) round($price * $qty);
                $subtotal += $lineSubtotal;

                $lineItems[] = [
                    'product' => $product,
                    'qty' => $qty,
                    'price' => $price,
                    'subtotal' => $lineSubtotal,
                ];
            }

            if ($discount < 0 || $discount > $subtotal) {
                throw ValidationException::withMessages(['discount' => 'Diskon tidak valid.']);
            }

            $total = $subtotal - $discount;

            // Resolve payment + status.
            if ($paymentMethod === Sale::PAYMENT_TUNAI) {
                if ($paidAmount < $total) {
                    throw ValidationException::withMessages([
                        'paid_amount' => 'Uang yang diterima kurang dari total belanja.',
                    ]);
                }
                $change = $paidAmount - $total;
                $status = Sale::STATUS_LUNAS;
            } else {
                $paidAmount = 0;
                $change = 0;
                $status = Sale::STATUS_UTANG;
            }

            $sale = Sale::create([
                'invoice_no' => $this->generateInvoiceNo(),
                'user_id' => $cashier->id,
                'customer_id' => $customerId,
                'subtotal' => $subtotal,
                'discount' => $discount,
                'total' => $total,
                'payment_method' => $paymentMethod,
                'paid_amount' => $paidAmount,
                'change_amount' => $change,
                'status' => $status,
                'note' => $data['note'] ?? null,
            ]);

            foreach ($lineItems as $li) {
                /** @var Product $product */
                $product = $li['product'];

                $sale->items()->create([
                    'product_id' => $product->id,
                    'product_name' => $product->name,
                    'unit_name' => $product->unit?->name ?? '',
                    'qty' => $li['qty'],
                    'price' => $li['price'],
                    'subtotal' => $li['subtotal'],
                ]);

                $this->stock->recordMovement(
                    $product,
                    -$li['qty'],
                    StockMovement::TYPE_SALE,
                    refType: Sale::class,
                    refId: $sale->id,
                    note: 'Penjualan '.$sale->invoice_no,
                );
            }

            if ($status === Sale::STATUS_UTANG && $customerId) {
                Customer::query()->whereKey($customerId)->increment('debt', $total);
            }

            return $sale;
        });
    }

    /**
     * Void (cancel) a sale: restore stock, reverse customer debt, mark as voided.
     */
    public function void(Sale $sale, User $user, ?string $reason = null): Sale
    {
        if ($sale->isVoided()) {
            throw ValidationException::withMessages(['sale' => 'Transaksi ini sudah dibatalkan.']);
        }

        return DB::transaction(function () use ($sale, $user, $reason) {
            $sale->load('items');

            // Return each item's quantity back to stock.
            foreach ($sale->items as $item) {
                $product = Product::query()->lockForUpdate()->find($item->product_id);
                if ($product) {
                    $this->stock->recordMovement(
                        $product,
                        (float) $item->qty,
                        StockMovement::TYPE_RETURN,
                        refType: Sale::class,
                        refId: $sale->id,
                        note: 'Pembatalan '.$sale->invoice_no,
                    );
                }
            }

            // Reverse outstanding debt created by an unpaid (utang) sale.
            if ($sale->status === Sale::STATUS_UTANG && $sale->customer_id) {
                $customer = Customer::query()->lockForUpdate()->find($sale->customer_id);
                if ($customer) {
                    $reduce = min((int) $sale->total, (int) $customer->debt);
                    $customer->decrement('debt', $reduce);
                }
            }

            $sale->forceFill([
                'voided_at' => now(),
                'voided_by' => $user->id,
                'void_reason' => $reason,
            ])->save();

            return $sale;
        });
    }

    /** Generate a sequential invoice number per day: TRX-YYYYMMDD-####. */
    private function generateInvoiceNo(): string
    {
        $prefix = 'TRX-'.now()->format('Ymd').'-';

        $last = Sale::query()
            ->where('invoice_no', 'like', $prefix.'%')
            ->lockForUpdate()
            ->orderByDesc('invoice_no')
            ->value('invoice_no');

        $next = $last ? ((int) substr($last, -4)) + 1 : 1;

        return $prefix.str_pad((string) $next, 4, '0', STR_PAD_LEFT);
    }
}
