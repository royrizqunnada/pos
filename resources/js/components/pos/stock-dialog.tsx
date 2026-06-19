import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatQty } from '@/lib/format';
import { cn } from '@/lib/utils';
import { type Product } from '@/types';
import { useForm } from '@inertiajs/react';
import { useEffect, useState } from 'react';

interface StockDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    product: Product | null;
    /** Initial tab; user can switch inside the dialog. */
    mode: 'add' | 'adjust';
}

export function StockDialog({ open, onOpenChange, product, mode }: StockDialogProps) {
    const [tab, setTab] = useState<'add' | 'adjust'>(mode);
    const isAdd = tab === 'add';

    const { data, setData, post, processing, errors, reset, clearErrors } = useForm<{
        qty: string;
        note: string;
        stock: string;
        reason: string;
    }>({ qty: '', note: '', stock: '', reason: '' });

    useEffect(() => {
        if (!open) return;
        setTab(mode);
        clearErrors();
        reset();
        if (product) {
            setData('stock', String(product.stock));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, product, mode]);

    if (!product) return null;

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        const url = isAdd ? `/barang/${product.id}/stok` : `/barang/${product.id}/penyesuaian`;
        post(url, { onSuccess: () => onOpenChange(false), preserveScroll: true });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Kelola Stok</DialogTitle>
                    <DialogDescription>
                        {product.name} — stok saat ini {formatQty(product.stock)} {product.unit?.name}
                    </DialogDescription>
                </DialogHeader>

                {/* Mode toggle */}
                <div className="bg-surface-alt grid grid-cols-2 gap-2 rounded-lg p-1">
                    {(
                        [
                            ['add', 'Tambah Stok'],
                            ['adjust', 'Stok Opname'],
                        ] as const
                    ).map(([key, label]) => (
                        <button
                            key={key}
                            type="button"
                            onClick={() => {
                                setTab(key);
                                clearErrors();
                            }}
                            className={cn(
                                'rounded-md px-3 py-2 text-sm font-medium transition-colors',
                                tab === key ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
                            )}
                        >
                            {label}
                        </button>
                    ))}
                </div>

                <form onSubmit={submit} className="space-y-4">
                    {isAdd ? (
                        <>
                            <div>
                                <Label htmlFor="qty">Jumlah Ditambah (barang masuk)</Label>
                                <Input
                                    id="qty"
                                    type="number"
                                    min={0}
                                    step="0.01"
                                    autoFocus
                                    value={data.qty}
                                    onChange={(e) => setData('qty', e.target.value)}
                                />
                                {errors.qty && <p className="text-destructive mt-1 text-xs">{errors.qty}</p>}
                                <p className="text-muted-foreground mt-1 text-xs">Stok akan bertambah dari jumlah saat ini.</p>
                            </div>
                            <div>
                                <Label htmlFor="note">Catatan (opsional)</Label>
                                <Input id="note" value={data.note} onChange={(e) => setData('note', e.target.value)} />
                            </div>
                        </>
                    ) : (
                        <>
                            <div>
                                <Label htmlFor="stock">Stok Aktual (hasil hitung fisik)</Label>
                                <Input
                                    id="stock"
                                    type="number"
                                    min={0}
                                    step="0.01"
                                    autoFocus
                                    value={data.stock}
                                    onChange={(e) => setData('stock', e.target.value)}
                                />
                                {errors.stock && <p className="text-destructive mt-1 text-xs">{errors.stock}</p>}
                                <p className="text-muted-foreground mt-1 text-xs">
                                    Stok akan diset sama persis dengan angka ini (untuk koreksi/opname).
                                </p>
                            </div>
                            <div>
                                <Label htmlFor="reason">Alasan Penyesuaian</Label>
                                <Input
                                    id="reason"
                                    placeholder="mis. barang rusak, selisih opname"
                                    value={data.reason}
                                    onChange={(e) => setData('reason', e.target.value)}
                                />
                                {errors.reason && <p className="text-destructive mt-1 text-xs">{errors.reason}</p>}
                            </div>
                        </>
                    )}

                    <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={processing}>
                            Batal
                        </Button>
                        <Button type="submit" disabled={processing}>
                            Simpan
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
