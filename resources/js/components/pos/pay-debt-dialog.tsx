import { type CustomerLite } from '@/components/pos/customer-form-dialog';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatRupiah } from '@/lib/format';
import { useForm } from '@inertiajs/react';
import { useEffect } from 'react';

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    customer: CustomerLite | null;
}

export function PayDebtDialog({ open, onOpenChange, customer }: Props) {
    const { data, setData, post, processing, errors, reset, clearErrors } = useForm({ amount: '', note: '' });

    useEffect(() => {
        if (open) {
            clearErrors();
            reset();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    if (!customer) return null;

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post(`/pelanggan/${customer.id}/bayar`, { onSuccess: () => onOpenChange(false), preserveScroll: true });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Bayar Utang</DialogTitle>
                    <DialogDescription>
                        {customer.name} — sisa utang <span className="text-destructive font-semibold">{formatRupiah(customer.debt)}</span>
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={submit} className="space-y-4">
                    <div>
                        <Label htmlFor="amount">Jumlah Bayar (Rp)</Label>
                        <Input
                            id="amount"
                            type="number"
                            min={1}
                            max={customer.debt}
                            autoFocus
                            value={data.amount}
                            onChange={(e) => setData('amount', e.target.value)}
                        />
                        {errors.amount && <p className="text-destructive mt-1 text-xs">{errors.amount}</p>}
                        <button
                            type="button"
                            onClick={() => setData('amount', String(customer.debt))}
                            className="text-primary mt-1 text-xs hover:underline"
                        >
                            Bayar lunas ({formatRupiah(customer.debt)})
                        </button>
                    </div>
                    <div>
                        <Label htmlFor="note">Catatan (opsional)</Label>
                        <Input id="note" value={data.note} onChange={(e) => setData('note', e.target.value)} />
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={processing}>
                            Batal
                        </Button>
                        <Button type="submit" disabled={processing}>
                            Catat Pembayaran
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
