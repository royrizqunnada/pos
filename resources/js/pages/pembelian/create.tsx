import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import PosLayout from '@/layouts/pos-layout';
import { formatRupiah } from '@/lib/format';
import { Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';

interface SupplierOpt {
    id: number;
    name: string;
}
interface ProductOpt {
    id: number;
    name: string;
    cost_price: number;
    unit_name: string;
}

interface Line {
    product_id: string;
    qty: string;
    cost_price: string;
}

interface Props {
    suppliers: SupplierOpt[];
    products: ProductOpt[];
}

export default function PembelianCreate({ suppliers, products }: Props) {
    const today = new Date().toISOString().slice(0, 10);
    const form = useForm<{
        supplier_id: string;
        ref_no: string;
        purchased_at: string;
        note: string;
        items: { product_id: number; qty: number; cost_price: number }[];
    }>({ supplier_id: '', ref_no: '', purchased_at: today, note: '', items: [] });

    const [lines, setLines] = useState<Line[]>([{ product_id: '', qty: '1', cost_price: '' }]);

    function updateLine(idx: number, patch: Partial<Line>) {
        setLines((prev) => prev.map((l, i) => (i === idx ? { ...l, ...patch } : l)));
    }
    function onProductChange(idx: number, productId: string) {
        const p = products.find((x) => x.id === Number(productId));
        updateLine(idx, { product_id: productId, cost_price: p ? String(p.cost_price) : '' });
    }
    function addLine() {
        setLines((prev) => [...prev, { product_id: '', qty: '1', cost_price: '' }]);
    }
    function removeLine(idx: number) {
        setLines((prev) => prev.filter((_, i) => i !== idx));
    }

    const validLines = lines.filter((l) => l.product_id && Number(l.qty) > 0);
    const total = validLines.reduce((sum, l) => sum + Number(l.cost_price || 0) * Number(l.qty || 0), 0);
    const canSubmit = !!form.data.supplier_id && validLines.length > 0;

    function submit(e: React.FormEvent) {
        e.preventDefault();
        form.transform((data) => ({
            ...data,
            items: validLines.map((l) => ({ product_id: Number(l.product_id), qty: Number(l.qty), cost_price: Number(l.cost_price || 0) })),
        }));
        form.post('/pembelian', { preserveScroll: true });
    }

    return (
        <PosLayout title="Pembelian Baru">
            <Link href="/pembelian" className="text-muted-foreground hover:text-foreground mb-4 inline-flex items-center gap-1 text-sm">
                <ArrowLeft className="h-4 w-4" /> Kembali
            </Link>

            <form onSubmit={submit} className="grid gap-4 lg:grid-cols-3">
                <div className="space-y-4 lg:col-span-2">
                    <div className="border-border bg-card rounded-xl border p-5">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                                <Label>Pemasok</Label>
                                <Select value={form.data.supplier_id} onValueChange={(v) => form.setData('supplier_id', v)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Pilih pemasok" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {suppliers.map((s) => (
                                            <SelectItem key={s.id} value={String(s.id)}>
                                                {s.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {form.errors.supplier_id && <p className="text-destructive mt-1 text-xs">{form.errors.supplier_id}</p>}
                            </div>
                            <div>
                                <Label htmlFor="purchased_at">Tanggal</Label>
                                <Input
                                    id="purchased_at"
                                    type="date"
                                    value={form.data.purchased_at}
                                    onChange={(e) => form.setData('purchased_at', e.target.value)}
                                />
                            </div>
                            <div>
                                <Label htmlFor="ref_no">No. Referensi (opsional)</Label>
                                <Input
                                    id="ref_no"
                                    placeholder="otomatis bila kosong"
                                    value={form.data.ref_no}
                                    onChange={(e) => form.setData('ref_no', e.target.value)}
                                />
                            </div>
                            <div>
                                <Label htmlFor="note">Catatan (opsional)</Label>
                                <Input id="note" value={form.data.note} onChange={(e) => form.setData('note', e.target.value)} />
                            </div>
                        </div>
                    </div>

                    <div className="border-border bg-card rounded-xl border p-5">
                        <div className="mb-3 flex items-center justify-between">
                            <h2 className="font-display font-semibold">Daftar Barang</h2>
                            <Button type="button" size="sm" variant="outline" onClick={addLine}>
                                <Plus className="h-4 w-4" /> Baris
                            </Button>
                        </div>
                        {form.errors.items && <p className="text-destructive mb-2 text-xs">{form.errors.items}</p>}
                        <div className="space-y-2">
                            {lines.map((l, idx) => {
                                const sub = Number(l.cost_price || 0) * Number(l.qty || 0);
                                return (
                                    <div key={idx} className="grid grid-cols-12 items-end gap-2">
                                        <div className="col-span-12 sm:col-span-5">
                                            <Label className="text-xs">Barang</Label>
                                            <Select value={l.product_id} onValueChange={(v) => onProductChange(idx, v)}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Pilih barang" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {products.map((p) => (
                                                        <SelectItem key={p.id} value={String(p.id)}>
                                                            {p.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="col-span-4 sm:col-span-2">
                                            <Label className="text-xs">Qty</Label>
                                            <Input
                                                type="number"
                                                min={0}
                                                step="0.01"
                                                value={l.qty}
                                                onChange={(e) => updateLine(idx, { qty: e.target.value })}
                                            />
                                        </div>
                                        <div className="col-span-5 sm:col-span-3">
                                            <Label className="text-xs">Harga Beli</Label>
                                            <Input
                                                type="number"
                                                min={0}
                                                value={l.cost_price}
                                                onChange={(e) => updateLine(idx, { cost_price: e.target.value })}
                                            />
                                        </div>
                                        <div className="col-span-2 flex items-center pb-2 text-right sm:col-span-1">
                                            <button
                                                type="button"
                                                onClick={() => removeLine(idx)}
                                                className="text-muted-foreground hover:text-destructive"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                        <div className="text-muted-foreground col-span-12 -mt-1 text-right text-xs sm:hidden">
                                            Subtotal {formatRupiah(sub)}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                <div className="border-border bg-card h-fit rounded-xl border p-5 lg:sticky lg:top-20">
                    <h2 className="font-display font-semibold">Ringkasan</h2>
                    <div className="mt-3 space-y-1 text-sm">
                        {validLines.map((l, i) => {
                            const p = products.find((x) => x.id === Number(l.product_id));
                            return (
                                <div key={i} className="flex justify-between gap-2">
                                    <span className="text-muted-foreground truncate">
                                        {p?.name} × {l.qty}
                                    </span>
                                    <span className="tabular">{formatRupiah(Number(l.cost_price || 0) * Number(l.qty || 0))}</span>
                                </div>
                            );
                        })}
                    </div>
                    <div className="border-border mt-3 flex items-center justify-between border-t pt-3">
                        <span className="font-display font-semibold">Total</span>
                        <span className="font-display text-primary tabular text-xl font-bold">{formatRupiah(total)}</span>
                    </div>
                    <Button type="submit" className="mt-4 w-full" size="lg" disabled={!canSubmit || form.processing}>
                        Simpan Pembelian
                    </Button>
                    <p className="text-muted-foreground mt-2 text-center text-xs">Stok & harga modal akan diperbarui otomatis.</p>
                </div>
            </form>
        </PosLayout>
    );
}
