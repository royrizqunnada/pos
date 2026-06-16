import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useForm } from '@inertiajs/react';
import { useEffect } from 'react';

export interface CustomerLite {
    id: number;
    name: string;
    phone: string | null;
    address: string | null;
    note: string | null;
    debt: number;
}

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    customer?: CustomerLite | null;
}

export function CustomerFormDialog({ open, onOpenChange, customer }: Props) {
    const isEdit = !!customer;
    const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
        name: '',
        phone: '',
        address: '',
        note: '',
    });

    useEffect(() => {
        if (!open) return;
        clearErrors();
        if (customer) {
            setData({
                name: customer.name,
                phone: customer.phone ?? '',
                address: customer.address ?? '',
                note: customer.note ?? '',
            });
        } else {
            reset();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, customer]);

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        const onSuccess = () => onOpenChange(false);
        if (isEdit && customer) {
            put(`/pelanggan/${customer.id}`, { onSuccess, preserveScroll: true });
        } else {
            post('/pelanggan', { onSuccess, preserveScroll: true });
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{isEdit ? 'Edit Pelanggan' : 'Tambah Pelanggan'}</DialogTitle>
                    <DialogDescription>Data pelanggan untuk transaksi dan pencatatan utang.</DialogDescription>
                </DialogHeader>
                <form onSubmit={submit} className="space-y-4">
                    <div>
                        <Label htmlFor="name">Nama</Label>
                        <Input id="name" value={data.name} onChange={(e) => setData('name', e.target.value)} autoFocus />
                        {errors.name && <p className="text-destructive mt-1 text-xs">{errors.name}</p>}
                    </div>
                    <div>
                        <Label htmlFor="phone">No. Telepon (opsional)</Label>
                        <Input id="phone" value={data.phone} onChange={(e) => setData('phone', e.target.value)} />
                        {errors.phone && <p className="text-destructive mt-1 text-xs">{errors.phone}</p>}
                    </div>
                    <div>
                        <Label htmlFor="address">Alamat (opsional)</Label>
                        <Input id="address" value={data.address} onChange={(e) => setData('address', e.target.value)} />
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
                            {isEdit ? 'Simpan' : 'Tambah'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
