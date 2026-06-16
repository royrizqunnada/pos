import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatQty } from '@/lib/format';
import { type Product } from '@/types';
import { useForm } from '@inertiajs/react';
import { useEffect } from 'react';

interface StockDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    product: Product | null;
    mode: 'add' | 'adjust';
}

export function StockDialog({ open, onOpenChange, product, mode }: StockDialogProps) {
    const isAdd = mode === 'add';

    const { data, setData, post, processing, errors, reset, clearErrors } = useForm<{
        qty: string;
        note: string;
        stock: string;
        reason: string;
    }>({ qty: '', note: '', stock: '', reason: '' });

    useEffect(() => {
        if (!open) return;
        clearErrors();
        reset();
        if (product && !isAdd) {
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
                    <DialogTitle>{isAdd ? 'Tambah Stok' : 'Penyesuaian Stok'}</DialogTitle>
                    <DialogDescription>
                        {product.name} — stok saat ini {formatQty(product.stock)} {product.unit?.name}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={submit} className="space-y-4">
                    {isAdd ? (
                        <>
                            <div>
                                <Label htmlFor="qty">Jumlah Ditambah</Label>
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
                            </div>
                            <div>
                                <Label htmlFor="note">Catatan (opsional)</Label>
                                <Input id="note" value={data.note} onChange={(e) => setData('note', e.target.value)} />
                            </div>
                        </>
                    ) : (
                        <>
                            <div>
                                <Label htmlFor="stock">Stok Aktual (hasil hitung)</Label>
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

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={processing}>
                            Batal
                        </Button>
                        <Button type="submit" disabled={processing}>
                            Simpan
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
