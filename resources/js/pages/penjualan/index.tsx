import { EmptyState } from '@/components/pos/empty-state';
import { Pagination } from '@/components/pos/pagination';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import PosLayout from '@/layouts/pos-layout';
import { formatDateTime, formatRupiah } from '@/lib/format';
import { cn } from '@/lib/utils';
import { type Paginated } from '@/types';
import { Link, router } from '@inertiajs/react';
import { ReceiptText, Search } from 'lucide-react';
import { useState } from 'react';

interface SaleRow {
    id: number;
    invoice_no: string;
    created_at: string;
    cashier: string | null;
    customer: string;
    payment_method: 'tunai' | 'utang';
    status: 'lunas' | 'utang';
    total: number;
    voided: boolean;
}

interface Props {
    sales: Paginated<SaleRow>;
    filters: { from: string | null; to: string | null; status: string | null; search: string };
}

export default function PenjualanIndex({ sales, filters }: Props) {
    const [from, setFrom] = useState(filters.from ?? '');
    const [to, setTo] = useState(filters.to ?? '');
    const [status, setStatus] = useState(filters.status ?? 'all');
    const [search, setSearch] = useState(filters.search ?? '');

    const apply = () =>
        router.get('/penjualan', clean({ from, to, status: status === 'all' ? '' : status, search }), {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });

    return (
        <PosLayout title="Riwayat Penjualan">
            {/* Filters */}
            <div className="border-border bg-card mb-5 flex flex-col gap-3 rounded-xl border p-4 lg:flex-row lg:items-end">
                <div>
                    <Label htmlFor="from">Dari</Label>
                    <Input id="from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="lg:w-40" />
                </div>
                <div>
                    <Label htmlFor="to">Sampai</Label>
                    <Input id="to" type="date" value={to} onChange={(e) => setTo(e.target.value)} className="lg:w-40" />
                </div>
                <div>
                    <Label>Status</Label>
                    <Select value={status} onValueChange={setStatus}>
                        <SelectTrigger className="lg:w-40">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Semua</SelectItem>
                            <SelectItem value="lunas">Lunas</SelectItem>
                            <SelectItem value="utang">Utang</SelectItem>
                            <SelectItem value="batal">Batal</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="relative flex-1">
                    <Label htmlFor="search">Cari</Label>
                    <Search className="text-muted-foreground absolute bottom-2.5 left-3 h-4 w-4" />
                    <Input
                        id="search"
                        placeholder="No. invoice / pelanggan…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && apply()}
                        className="pl-9"
                    />
                </div>
                <Button onClick={apply}>Terapkan</Button>
            </div>

            <div className="border-border bg-card overflow-hidden rounded-xl border">
                {sales.data.length === 0 ? (
                    <EmptyState icon={ReceiptText} title="Belum ada transaksi" description="Transaksi penjualan akan muncul di sini." />
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-border bg-surface-alt text-muted-foreground border-b text-left text-xs tracking-wide uppercase">
                                    <th className="px-4 py-3 font-medium">No. Invoice</th>
                                    <th className="px-4 py-3 font-medium">Waktu</th>
                                    <th className="px-4 py-3 font-medium">Kasir</th>
                                    <th className="px-4 py-3 font-medium">Pelanggan</th>
                                    <th className="px-4 py-3 font-medium">Status</th>
                                    <th className="px-4 py-3 text-right font-medium">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sales.data.map((s) => (
                                    <tr key={s.id} className="border-border hover:bg-surface-alt/50 border-b last:border-0">
                                        <td className="px-4 py-3">
                                            <Link
                                                href={`/penjualan/${s.id}`}
                                                className={cn('hover:text-primary font-mono text-xs font-medium', s.voided && 'line-through')}
                                            >
                                                {s.invoice_no}
                                            </Link>
                                        </td>
                                        <td className="text-muted-foreground px-4 py-3">{formatDateTime(s.created_at)}</td>
                                        <td className="text-muted-foreground px-4 py-3">{s.cashier ?? '—'}</td>
                                        <td className="px-4 py-3">{s.customer}</td>
                                        <td className="px-4 py-3">
                                            <StatusPill voided={s.voided} status={s.status} />
                                        </td>
                                        <td
                                            className={cn(
                                                'tabular px-4 py-3 text-right font-medium',
                                                s.voided && 'text-muted-foreground line-through',
                                            )}
                                        >
                                            {formatRupiah(s.total)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
                <Pagination paginator={sales} />
            </div>
        </PosLayout>
    );
}

function StatusPill({ voided, status }: { voided: boolean; status: string }) {
    if (voided) {
        return <span className="bg-muted text-muted-foreground rounded-full px-2.5 py-0.5 text-xs font-semibold">Batal</span>;
    }
    if (status === 'utang') {
        return <span className="bg-destructive/10 text-destructive rounded-full px-2.5 py-0.5 text-xs font-semibold">Utang</span>;
    }
    return <span className="bg-success/10 text-success rounded-full px-2.5 py-0.5 text-xs font-semibold">Lunas</span>;
}

function clean(params: Record<string, unknown>) {
    const out: Record<string, string> = {};
    for (const [k, v] of Object.entries(params)) {
        if (v === null || v === '' || v === false) continue;
        out[k] = String(v);
    }
    return out;
}
