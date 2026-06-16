import { ConfirmDialog } from '@/components/pos/confirm-dialog';
import { EmptyState } from '@/components/pos/empty-state';
import { Pagination } from '@/components/pos/pagination';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import PosLayout from '@/layouts/pos-layout';
import { type Paginated } from '@/types';
import { router, useForm } from '@inertiajs/react';
import { Pencil, Plus, Search, Store, Trash2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface Supplier {
    id: number;
    name: string;
    phone: string | null;
    address: string | null;
    note: string | null;
    purchases_count: number;
}

interface Props {
    suppliers: Paginated<Supplier>;
    filters: { search: string };
}

export default function PemasokIndex({ suppliers, filters }: Props) {
    const [search, setSearch] = useState(filters.search ?? '');
    const firstRender = useRef(true);

    useEffect(() => {
        if (firstRender.current) {
            firstRender.current = false;
            return;
        }
        const t = setTimeout(() => {
            router.get('/pemasok', search ? { search } : {}, { preserveState: true, replace: true, preserveScroll: true });
        }, 350);
        return () => clearTimeout(t);
    }, [search]);

    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState<Supplier | null>(null);
    const [deleting, setDeleting] = useState<Supplier | null>(null);
    const destroy = useForm({});

    const form = useForm({ name: '', phone: '', address: '', note: '' });

    function openCreate() {
        setEditing(null);
        form.reset();
        form.clearErrors();
        setOpen(true);
    }
    function openEdit(s: Supplier) {
        setEditing(s);
        form.setData({ name: s.name, phone: s.phone ?? '', address: s.address ?? '', note: s.note ?? '' });
        form.clearErrors();
        setOpen(true);
    }
    function submit(e: React.FormEvent) {
        e.preventDefault();
        const onSuccess = () => setOpen(false);
        if (editing) {
            form.put(`/pemasok/${editing.id}`, { onSuccess, preserveScroll: true });
        } else {
            form.post('/pemasok', { onSuccess, preserveScroll: true });
        }
    }

    return (
        <PosLayout
            title="Pemasok"
            actions={
                <Button onClick={openCreate}>
                    <Plus className="h-4 w-4" /> Tambah Pemasok
                </Button>
            }
        >
            <div className="relative mb-4 max-w-md">
                <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                <Input placeholder="Cari pemasok…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>

            <div className="border-border bg-card overflow-hidden rounded-xl border">
                {suppliers.data.length === 0 ? (
                    <EmptyState icon={Store} title="Belum ada pemasok" description="Tambahkan pemasok untuk mencatat pembelian." />
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-border bg-surface-alt text-muted-foreground border-b text-left text-xs tracking-wide uppercase">
                                    <th className="px-4 py-3 font-medium">Nama</th>
                                    <th className="px-4 py-3 font-medium">Telepon</th>
                                    <th className="px-4 py-3 font-medium">Alamat</th>
                                    <th className="px-4 py-3 text-right font-medium">Pembelian</th>
                                    <th className="px-4 py-3 text-right font-medium">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {suppliers.data.map((s) => (
                                    <tr key={s.id} className="border-border hover:bg-surface-alt/50 border-b last:border-0">
                                        <td className="text-foreground px-4 py-3 font-medium">{s.name}</td>
                                        <td className="text-muted-foreground px-4 py-3">{s.phone ?? '—'}</td>
                                        <td className="text-muted-foreground px-4 py-3">{s.address ?? '—'}</td>
                                        <td className="tabular px-4 py-3 text-right">{s.purchases_count}x</td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center justify-end gap-1">
                                                <Button size="icon" variant="ghost" title="Edit" onClick={() => openEdit(s)}>
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    title="Hapus"
                                                    className="text-destructive hover:text-destructive"
                                                    onClick={() => setDeleting(s)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
                <Pagination paginator={suppliers} />
            </div>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editing ? 'Edit Pemasok' : 'Tambah Pemasok'}</DialogTitle>
                        <DialogDescription>Data pemasok untuk pembelian / restock barang.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={submit} className="space-y-4">
                        <div>
                            <Label htmlFor="name">Nama</Label>
                            <Input id="name" value={form.data.name} onChange={(e) => form.setData('name', e.target.value)} autoFocus />
                            {form.errors.name && <p className="text-destructive mt-1 text-xs">{form.errors.name}</p>}
                        </div>
                        <div>
                            <Label htmlFor="phone">Telepon (opsional)</Label>
                            <Input id="phone" value={form.data.phone} onChange={(e) => form.setData('phone', e.target.value)} />
                        </div>
                        <div>
                            <Label htmlFor="address">Alamat (opsional)</Label>
                            <Input id="address" value={form.data.address} onChange={(e) => form.setData('address', e.target.value)} />
                        </div>
                        <div>
                            <Label htmlFor="note">Catatan (opsional)</Label>
                            <Input id="note" value={form.data.note} onChange={(e) => form.setData('note', e.target.value)} />
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={form.processing}>
                                Batal
                            </Button>
                            <Button type="submit" disabled={form.processing}>
                                {editing ? 'Simpan' : 'Tambah'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <ConfirmDialog
                open={!!deleting}
                onOpenChange={(o) => !o && setDeleting(null)}
                title="Hapus pemasok?"
                description={deleting ? `"${deleting.name}" akan dihapus.` : ''}
                destructive
                confirmLabel="Hapus"
                processing={destroy.processing}
                onConfirm={() => deleting && destroy.delete(`/pemasok/${deleting.id}`, { preserveScroll: true, onSuccess: () => setDeleting(null) })}
            />
        </PosLayout>
    );
}
