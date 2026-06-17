import { EmptyState } from '@/components/pos/empty-state';
import { Pagination } from '@/components/pos/pagination';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import PosLayout from '@/layouts/pos-layout';
import { formatDateTime } from '@/lib/format';
import { type Paginated } from '@/types';
import { router } from '@inertiajs/react';
import { History, Search } from 'lucide-react';
import { useState } from 'react';
import { type LogRow } from './index';

interface Props {
    logs: Paginated<LogRow>;
    events: string[];
    filters: { event: string | null; from: string | null; to: string | null; search: string };
}

/** Human-friendly labels for the machine event keys. */
const EVENT_LABELS: Record<string, string> = {
    'auth.login': 'Masuk',
    'auth.logout': 'Keluar',
    'penjualan.buat': 'Penjualan',
    'penjualan.batal': 'Batal Jual',
    'barang.buat': 'Barang Baru',
    'barang.ubah': 'Ubah Barang',
    'barang.hapus': 'Hapus Barang',
    'barang.stok': 'Tambah Stok',
    'barang.penyesuaian': 'Penyesuaian',
    'pembelian.buat': 'Pembelian',
    'pelanggan.buat': 'Pelanggan Baru',
    'pelanggan.ubah': 'Ubah Pelanggan',
    'pelanggan.hapus': 'Hapus Pelanggan',
    'pelanggan.bayar': 'Bayar Utang',
    'pengaturan.toko': 'Profil Toko',
    'pengaturan.pengguna.buat': 'Akun Baru',
    'pengaturan.pengguna.ubah': 'Ubah Akun',
};

function eventLabel(event: string) {
    return EVENT_LABELS[event] ?? event;
}

export default function PengaturanLog({ logs, events, filters }: Props) {
    const [event, setEvent] = useState(filters.event ?? 'all');
    const [from, setFrom] = useState(filters.from ?? '');
    const [to, setTo] = useState(filters.to ?? '');
    const [search, setSearch] = useState(filters.search ?? '');

    const apply = () =>
        router.get('/pengaturan/log', clean({ event: event === 'all' ? '' : event, from, to, search }), {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });

    return (
        <PosLayout title="Log Aktivitas">
            {/* Filters */}
            <div className="border-border bg-card mb-5 flex flex-col gap-3 rounded-xl border p-4 lg:flex-row lg:items-end">
                <div>
                    <Label>Jenis</Label>
                    <Select value={event} onValueChange={setEvent}>
                        <SelectTrigger className="lg:w-48">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Semua</SelectItem>
                            {events.map((e) => (
                                <SelectItem key={e} value={e}>
                                    {eventLabel(e)}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div>
                    <Label htmlFor="from">Dari</Label>
                    <Input id="from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="lg:w-40" />
                </div>
                <div>
                    <Label htmlFor="to">Sampai</Label>
                    <Input id="to" type="date" value={to} onChange={(e) => setTo(e.target.value)} className="lg:w-40" />
                </div>
                <div className="relative flex-1">
                    <Label htmlFor="search">Cari</Label>
                    <Search className="text-muted-foreground absolute bottom-2.5 left-3 h-4 w-4" />
                    <Input
                        id="search"
                        placeholder="Keterangan…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && apply()}
                        className="pl-9"
                    />
                </div>
                <Button onClick={apply}>Terapkan</Button>
            </div>

            <div className="border-border bg-card overflow-hidden rounded-xl border">
                {logs.data.length === 0 ? (
                    <EmptyState icon={History} title="Belum ada aktivitas" description="Aktivitas pengguna akan tercatat di sini." />
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-border bg-surface-alt text-muted-foreground border-b text-left text-xs tracking-wide uppercase">
                                    <th className="px-4 py-3 font-medium">Waktu</th>
                                    <th className="px-4 py-3 font-medium">Jenis</th>
                                    <th className="px-4 py-3 font-medium">Keterangan</th>
                                    <th className="px-4 py-3 font-medium">Pengguna</th>
                                    <th className="px-4 py-3 font-medium">IP</th>
                                </tr>
                            </thead>
                            <tbody>
                                {logs.data.map((l) => (
                                    <tr key={l.id} className="border-border hover:bg-surface-alt/50 border-b last:border-0">
                                        <td className="text-muted-foreground px-4 py-3 whitespace-nowrap">{formatDateTime(l.created_at)}</td>
                                        <td className="px-4 py-3">
                                            <span className="bg-muted text-muted-foreground rounded-full px-2.5 py-0.5 text-xs font-semibold">
                                                {eventLabel(l.event)}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">{l.description}</td>
                                        <td className="px-4 py-3">{l.user}</td>
                                        <td className="text-muted-foreground px-4 py-3 font-mono text-xs">{l.ip_address ?? '—'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
                <Pagination paginator={logs} />
            </div>
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
