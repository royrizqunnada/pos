import { CategoryBadge } from '@/components/pos/category-badge';
import { ReceiptDialog } from '@/components/pos/receipt';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import PosLayout from '@/layouts/pos-layout';
import { formatQty, formatRupiah } from '@/lib/format';
import { cn } from '@/lib/utils';
import { type Category, type ReceiptData } from '@/types';
import { useForm } from '@inertiajs/react';
import { Barcode, Minus, Plus, Search, ShoppingCart, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

interface PosProduct {
    id: number;
    name: string;
    barcode: string | null;
    sku: string | null;
    category_id: number;
    category: Category | null;
    unit_name: string;
    sell_price: number;
    wholesale_price: number | null;
    wholesale_min_qty: number | null;
    stock: number;
}

interface CartLine {
    product: PosProduct;
    qty: number;
}

interface Props {
    products: PosProduct[];
    categories: Category[];
    customers: { id: number; name: string; debt: number }[];
    receipt: ReceiptData | null;
}

function unitPrice(p: PosProduct, qty: number): number {
    if (p.wholesale_price !== null && p.wholesale_min_qty !== null && qty >= p.wholesale_min_qty) {
        return p.wholesale_price;
    }
    return p.sell_price;
}

export default function KasirIndex({ products, categories, customers, receipt }: Props) {
    const [search, setSearch] = useState('');
    const [activeCat, setActiveCat] = useState<number | null>(null);
    const [cart, setCart] = useState<CartLine[]>([]);
    const barcodeRef = useRef<HTMLInputElement>(null);
    const [barcode, setBarcode] = useState('');
    const [barcodeError, setBarcodeError] = useState('');

    const [receiptOpen, setReceiptOpen] = useState(false);

    const form = useForm<{
        items: { product_id: number; qty: number }[];
        customer_id: string;
        payment_method: 'tunai' | 'utang';
        paid_amount: number | string;
        discount: number | string;
        note: string;
    }>({
        items: [],
        customer_id: '',
        payment_method: 'tunai',
        paid_amount: '',
        discount: '',
        note: '',
    });

    // Show receipt after a successful checkout (arrives via flashed prop).
    useEffect(() => {
        if (receipt) {
            setReceiptOpen(true);
            setCart([]);
            form.reset();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [receipt]);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        return products.filter((p) => {
            if (activeCat && p.category_id !== activeCat) return false;
            if (!q) return true;
            return p.name.toLowerCase().includes(q) || (p.sku?.toLowerCase().includes(q) ?? false) || (p.barcode?.toLowerCase().includes(q) ?? false);
        });
    }, [products, search, activeCat]);

    function addToCart(p: PosProduct, qty = 1) {
        if (p.stock <= 0) return;
        setCart((prev) => {
            const existing = prev.find((l) => l.product.id === p.id);
            if (existing) {
                const next = Math.min(existing.qty + qty, p.stock);
                return prev.map((l) => (l.product.id === p.id ? { ...l, qty: next } : l));
            }
            return [...prev, { product: p, qty: Math.min(qty, p.stock) }];
        });
    }

    function setQty(id: number, qty: number) {
        setCart((prev) =>
            prev.map((l) => (l.product.id === id ? { ...l, qty: Math.max(0, Math.min(qty, l.product.stock)) } : l)).filter((l) => l.qty > 0),
        );
    }

    function removeLine(id: number) {
        setCart((prev) => prev.filter((l) => l.product.id !== id));
    }

    function onBarcodeEnter(e: React.KeyboardEvent<HTMLInputElement>) {
        if (e.key !== 'Enter') return;
        e.preventDefault();
        const code = barcode.trim();
        if (!code) return;
        const found = products.find((p) => p.barcode === code || p.sku === code);
        if (found) {
            addToCart(found);
            setBarcode('');
            setBarcodeError('');
        } else {
            setBarcodeError(`Barcode "${code}" tidak ditemukan.`);
        }
        barcodeRef.current?.focus();
    }

    const subtotal = cart.reduce((sum, l) => sum + unitPrice(l.product, l.qty) * l.qty, 0);
    const discount = Number(form.data.discount) || 0;
    const total = Math.max(subtotal - discount, 0);
    const paid = Number(form.data.paid_amount) || 0;
    const change = form.data.payment_method === 'tunai' ? paid - total : 0;

    const canSubmit = cart.length > 0 && discount <= subtotal && (form.data.payment_method === 'utang' ? !!form.data.customer_id : paid >= total);

    function submit() {
        form.transform((data) => ({
            ...data,
            items: cart.map((l) => ({ product_id: l.product.id, qty: l.qty })),
            customer_id: data.customer_id || null,
            discount: Number(data.discount) || 0,
            paid_amount: data.payment_method === 'tunai' ? Number(data.paid_amount) || 0 : 0,
        }));
        form.post('/kasir', { preserveScroll: true });
    }

    return (
        <PosLayout title="Kasir">
            <div className="grid gap-4 lg:grid-cols-[1fr_390px]">
                {/* Product picker */}
                <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-3 sm:flex-row">
                        <div className="relative flex-1">
                            <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                            <Input placeholder="Cari barang…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
                        </div>
                        <div className="relative sm:w-64">
                            <Barcode className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                            <Input
                                ref={barcodeRef}
                                placeholder="Scan / ketik barcode + Enter"
                                value={barcode}
                                onChange={(e) => setBarcode(e.target.value)}
                                onKeyDown={onBarcodeEnter}
                                className="pl-9"
                            />
                        </div>
                    </div>
                    {barcodeError && <p className="text-destructive -mt-2 text-xs">{barcodeError}</p>}

                    {/* Category chips */}
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={() => setActiveCat(null)}
                            className={cn(
                                'rounded-full border px-3 py-1 text-sm',
                                activeCat === null ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card hover:bg-accent',
                            )}
                        >
                            Semua
                        </button>
                        {categories.map((c) => (
                            <button
                                key={c.id}
                                onClick={() => setActiveCat(c.id)}
                                className={cn(
                                    'rounded-full border px-3 py-1 text-sm',
                                    activeCat === c.id
                                        ? 'border-primary bg-primary text-primary-foreground'
                                        : 'border-border bg-card hover:bg-accent',
                                )}
                            >
                                {c.name}
                            </button>
                        ))}
                    </div>

                    {/* Grid */}
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
                        {filtered.map((p) => {
                            const out = p.stock <= 0;
                            return (
                                <button
                                    key={p.id}
                                    disabled={out}
                                    onClick={() => addToCart(p)}
                                    className={cn(
                                        'border-border bg-card hover:border-primary flex flex-col rounded-xl border p-3 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-50',
                                    )}
                                >
                                    {p.category && <CategoryBadge name={p.category.name} color={p.category.color} />}
                                    <span className="text-foreground mt-2 line-clamp-2 text-sm font-medium">{p.name}</span>
                                    <span className="font-display text-primary tabular mt-1 text-base font-semibold">
                                        {formatRupiah(p.sell_price)}
                                    </span>
                                    <span className={cn('mt-0.5 text-xs', out ? 'text-destructive' : 'text-muted-foreground')}>
                                        Stok {formatQty(p.stock)} {p.unit_name}
                                    </span>
                                </button>
                            );
                        })}
                        {filtered.length === 0 && (
                            <p className="text-muted-foreground col-span-full py-10 text-center text-sm">Tidak ada barang cocok.</p>
                        )}
                    </div>
                </div>

                {/* Cart */}
                <div className="border-border bg-card flex h-fit flex-col rounded-xl border lg:sticky lg:top-20">
                    <div className="border-border flex items-center gap-2 border-b px-4 py-3">
                        <ShoppingCart className="text-primary h-5 w-5" />
                        <span className="font-display font-semibold">Keranjang</span>
                        <span className="text-muted-foreground ml-auto text-sm">{cart.length} item</span>
                    </div>

                    <div className="max-h-[40vh] flex-1 overflow-y-auto">
                        {cart.length === 0 ? (
                            <p className="text-muted-foreground px-4 py-10 text-center text-sm">Keranjang kosong. Pilih barang di kiri.</p>
                        ) : (
                            cart.map((l) => {
                                const price = unitPrice(l.product, l.qty);
                                const isWholesale = price !== l.product.sell_price;
                                return (
                                    <div key={l.product.id} className="border-border border-b px-4 py-3 last:border-0">
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="min-w-0">
                                                <div className="text-foreground text-sm font-medium">{l.product.name}</div>
                                                <div className="text-muted-foreground text-xs">
                                                    {formatRupiah(price)} / {l.product.unit_name}
                                                    {isWholesale && <span className="text-success ml-1">grosir</span>}
                                                </div>
                                            </div>
                                            <button onClick={() => removeLine(l.product.id)} className="text-muted-foreground hover:text-destructive">
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                        <div className="mt-2 flex items-center justify-between">
                                            <div className="flex items-center gap-1">
                                                <Button
                                                    size="icon"
                                                    variant="outline"
                                                    className="h-7 w-7"
                                                    onClick={() => setQty(l.product.id, l.qty - 1)}
                                                >
                                                    <Minus className="h-3 w-3" />
                                                </Button>
                                                <Input
                                                    type="number"
                                                    step="0.01"
                                                    min={0}
                                                    value={l.qty}
                                                    onChange={(e) => setQty(l.product.id, Number(e.target.value))}
                                                    className="h-7 w-20 text-center"
                                                />
                                                <Button
                                                    size="icon"
                                                    variant="outline"
                                                    className="h-7 w-7"
                                                    onClick={() => setQty(l.product.id, l.qty + 1)}
                                                >
                                                    <Plus className="h-3 w-3" />
                                                </Button>
                                            </div>
                                            <span className="tabular text-sm font-semibold">{formatRupiah(price * l.qty)}</span>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {/* Checkout */}
                    <div className="border-border space-y-3 border-t p-4">
                        <div>
                            <label className="text-muted-foreground text-xs font-medium">Pelanggan</label>
                            <Select value={form.data.customer_id || 'umum'} onValueChange={(v) => form.setData('customer_id', v === 'umum' ? '' : v)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Pelanggan Umum" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="umum">Pelanggan Umum</SelectItem>
                                    {customers.map((c) => (
                                        <SelectItem key={c.id} value={String(c.id)}>
                                            {c.name}
                                            {c.debt > 0 ? ` · utang ${formatRupiah(c.debt)}` : ''}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {form.errors.customer_id && <p className="text-destructive mt-1 text-xs">{form.errors.customer_id}</p>}
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            {(['tunai', 'utang'] as const).map((m) => (
                                <button
                                    key={m}
                                    onClick={() => form.setData('payment_method', m)}
                                    className={cn(
                                        'rounded-md border py-2 text-sm font-medium capitalize',
                                        form.data.payment_method === m
                                            ? m === 'utang'
                                                ? 'border-destructive bg-destructive text-destructive-foreground'
                                                : 'border-primary bg-primary text-primary-foreground'
                                            : 'border-border bg-card hover:bg-accent',
                                    )}
                                >
                                    {m}
                                </button>
                            ))}
                        </div>

                        <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Subtotal</span>
                            <span className="tabular">{formatRupiah(subtotal)}</span>
                        </div>
                        <div className="flex items-center justify-between gap-2 text-sm">
                            <span className="text-muted-foreground">Diskon</span>
                            <Input
                                type="number"
                                min={0}
                                value={form.data.discount}
                                onChange={(e) => form.setData('discount', e.target.value)}
                                className="h-8 w-32 text-right"
                                placeholder="0"
                            />
                        </div>
                        {form.errors.discount && <p className="text-destructive text-right text-xs">{form.errors.discount}</p>}

                        <div className="border-border flex items-center justify-between border-t pt-2">
                            <span className="font-display font-semibold">Total</span>
                            <span className="font-display text-primary tabular text-xl font-bold">{formatRupiah(total)}</span>
                        </div>

                        {form.data.payment_method === 'tunai' && (
                            <>
                                <div className="flex items-center justify-between gap-2 text-sm">
                                    <span className="text-muted-foreground">Uang Diterima</span>
                                    <Input
                                        type="number"
                                        min={0}
                                        value={form.data.paid_amount}
                                        onChange={(e) => form.setData('paid_amount', e.target.value)}
                                        className="h-8 w-32 text-right"
                                        placeholder="0"
                                    />
                                </div>
                                {form.errors.paid_amount && <p className="text-destructive text-right text-xs">{form.errors.paid_amount}</p>}
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">Kembalian</span>
                                    <span className={cn('tabular font-semibold', change < 0 ? 'text-destructive' : 'text-success')}>
                                        {formatRupiah(Math.max(change, 0))}
                                    </span>
                                </div>
                            </>
                        )}

                        {form.errors.items && <p className="text-destructive text-xs">{form.errors.items}</p>}

                        <Button className="w-full" size="lg" disabled={!canSubmit || form.processing} onClick={submit}>
                            Proses Transaksi
                        </Button>
                    </div>
                </div>
            </div>

            <ReceiptDialog open={receiptOpen} onOpenChange={setReceiptOpen} receipt={receipt} />
        </PosLayout>
    );
}
