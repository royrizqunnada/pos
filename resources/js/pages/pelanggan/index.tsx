import { ConfirmDialog } from '@/components/pos/confirm-dialog';
import { CustomerFormDialog, type CustomerLite } from '@/components/pos/customer-form-dialog';
import { EmptyState } from '@/components/pos/empty-state';
import { Pagination } from '@/components/pos/pagination';
import { PayDebtDialog } from '@/components/pos/pay-debt-dialog';
import { StatCard } from '@/components/pos/stat-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import PosLayout from '@/layouts/pos-layout';
import { formatRupiah } from '@/lib/format';
import { type Paginated } from '@/types';
import { Link, router, useForm } from '@inertiajs/react';
import { HandCoins, Pencil, Plus, Search, Trash2, Users, Wallet } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface Props {
    customers: Paginated<CustomerLite>;
    filters: { search: string; with_debt: boolean };
    summary: { total_customers: number; debtor_count: number; total_debt: number };
    can: { delete: boolean };
}

export default function PelangganIndex({ customers, filters, summary, can }: Props) {
    const [search, setSearch] = useState(filters.search ?? '');
    const first = useRef(true);

    useEffect(() => {
        if (first.current) {
            first.current = false;
            return;
        }
        const t = setTimeout(() => {
            router.get('/pelanggan', clean({ search, with_debt: filters.with_debt }), {
                preserveState: true,
                replace: true,
                preserveScroll: true,
            });
        }, 350);
        return () => clearTimeout(t);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search]);

    const [formOpen, setFormOpen] = useState(false);
    const [editing, setEditing] = useState<CustomerLite | null>(null);
    const [payOpen, setPayOpen] = useState(false);
    const [paying, setPaying] = useState<CustomerLite | null>(null);
    const [deleting, setDeleting] = useState<CustomerLite | null>(null);
    const destroy = useForm({});

    return (
        <PosLayout
            title="Pelanggan"
            actions={
                <Button
                    onClick={() => {
                        setEditing(null);
                        setFormOpen(true);
                    }}
                >
                    <Plus className="h-4 w-4" /> Tambah Pelanggan
                </Button>
            }
        >
            <div className="mb-5 grid gap-4 sm:grid-cols-3">
                <StatCard label="Total Pelanggan" value={String(summary.total_customers)} icon={Users} />
                <StatCard label="Pelanggan Berutang" value={String(summary.debtor_count)} icon={HandCoins} tone="amber" />
                <StatCard label="Total Piutang" value={formatRupiah(summary.total_debt)} icon={Wallet} tone="danger" />
            </div>

            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="relative flex-1">
                    <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                    <Input placeholder="Cari nama atau telepon…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
                </div>
                <Button
                    variant={filters.with_debt ? 'default' : 'outline'}
                    onClick={() =>
                        router.get('/pelanggan', clean({ search, with_debt: !filters.with_debt }), {
                            preserveState: true,
                            replace: true,
                            preserveScroll: true,
                        })
                    }
                >
                    <HandCoins className="h-4 w-4" /> Hanya Berutang
                </Button>
            </div>

            <div className="border-border bg-card overflow-hidden rounded-xl border">
                {customers.data.length === 0 ? (
                    <EmptyState icon={Users} title="Belum ada pelanggan" description="Tambahkan pelanggan untuk mencatat transaksi & utang." />
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-border bg-surface-alt text-muted-foreground border-b text-left text-xs tracking-wide uppercase">
                                    <th className="px-4 py-3 font-medium">Nama</th>
                                    <th className="px-4 py-3 font-medium">Telepon</th>
                                    <th className="px-4 py-3 text-right font-medium">Utang</th>
                                    <th className="px-4 py-3 text-right font-medium">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {customers.data.map((c) => (
                                    <tr key={c.id} className="border-border hover:bg-surface-alt/50 border-b last:border-0">
                                        <td className="px-4 py-3">
                                            <Link href={`/pelanggan/${c.id}`} className="text-foreground hover:text-primary font-medium">
                                                {c.name}
                                            </Link>
                                            {c.address && <div className="text-muted-foreground text-xs">{c.address}</div>}
                                        </td>
                                        <td className="text-muted-foreground px-4 py-3">{c.phone ?? '—'}</td>
                                        <td className="tabular px-4 py-3 text-right">
                                            {c.debt > 0 ? (
                                                <span className="text-destructive font-semibold">{formatRupiah(c.debt)}</span>
                                            ) : (
                                                <span className="text-muted-foreground">Lunas</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center justify-end gap-1">
                                                {c.debt > 0 && (
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => {
                                                            setPaying(c);
                                                            setPayOpen(true);
                                                        }}
                                                    >
                                                        <HandCoins className="h-4 w-4" /> Bayar
                                                    </Button>
                                                )}
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    title="Edit"
                                                    onClick={() => {
                                                        setEditing(c);
                                                        setFormOpen(true);
                                                    }}
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                {can.delete && (
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        title="Hapus"
                                                        className="text-destructive hover:text-destructive"
                                                        onClick={() => setDeleting(c)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
                <Pagination paginator={customers} />
            </div>

            <CustomerFormDialog open={formOpen} onOpenChange={setFormOpen} customer={editing} />
            <PayDebtDialog open={payOpen} onOpenChange={setPayOpen} customer={paying} />
            <ConfirmDialog
                open={!!deleting}
                onOpenChange={(o) => !o && setDeleting(null)}
                title="Hapus pelanggan?"
                description={deleting ? `"${deleting.name}" akan dihapus.` : ''}
                destructive
                confirmLabel="Hapus"
                processing={destroy.processing}
                onConfirm={() =>
                    deleting && destroy.delete(`/pelanggan/${deleting.id}`, { preserveScroll: true, onSuccess: () => setDeleting(null) })
                }
            />
        </PosLayout>
    );
}

function clean(params: Record<string, unknown>) {
    const out: Record<string, string> = {};
    for (const [k, v] of Object.entries(params)) {
        if (v === null || v === '' || v === false) continue;
        out[k] = String(v);
    }
    return out;
}
