import { CategoryBadge } from '@/components/pos/category-badge';
import { StatCard } from '@/components/pos/stat-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import PosLayout from '@/layouts/pos-layout';
import { formatQty, formatRupiah } from '@/lib/format';
import { router } from '@inertiajs/react';
import { Boxes, Download, Receipt, TrendingUp, Wallet } from 'lucide-react';
import { useState } from 'react';

interface Props {
    filters: { from: string; to: string };
    summary: { omzet: number; transaksi: number; rata_rata: number; diskon: number };
    profit: { omzet: number; modal: number; laba_kotor: number } | null;
    by_category: { name: string; color: string; total: number; qty: number }[];
    top_products: { name: string; unit: string; qty: number; total: number }[];
    receivables: { total: number; customers: { id: number; name: string; phone: string | null; debt: number }[] };
    inventory_value: number | null;
    is_owner: boolean;
}

export default function LaporanIndex({ filters, summary, profit, by_category, top_products, receivables, inventory_value, is_owner }: Props) {
    const [from, setFrom] = useState(filters.from);
    const [to, setTo] = useState(filters.to);

    const apply = () => router.get('/laporan', { from, to }, { preserveState: true, preserveScroll: true });
    const exportUrl = (type: string) => `/laporan/ekspor?type=${type}&from=${from}&to=${to}`;

    const maxCat = Math.max(1, ...by_category.map((c) => c.total));

    return (
        <PosLayout title="Laporan">
            {/* Date range */}
            <div className="border-border bg-card mb-5 flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-end">
                <div>
                    <Label htmlFor="from">Dari Tanggal</Label>
                    <Input id="from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="sm:w-44" />
                </div>
                <div>
                    <Label htmlFor="to">Sampai Tanggal</Label>
                    <Input id="to" type="date" value={to} onChange={(e) => setTo(e.target.value)} className="sm:w-44" />
                </div>
                <Button onClick={apply}>Terapkan</Button>
                <Button variant="outline" className="sm:ml-auto" asChild>
                    <a href={exportUrl('penjualan')}>
                        <Download className="h-4 w-4" /> Ekspor Rekap CSV
                    </a>
                </Button>
            </div>

            {/* Summary */}
            <div className="mb-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard label="Omzet" value={formatRupiah(summary.omzet)} icon={Receipt} tone="amber" />
                <StatCard label="Transaksi" value={String(summary.transaksi)} icon={Receipt} />
                <StatCard label="Rata-rata / Transaksi" value={formatRupiah(summary.rata_rata)} icon={Receipt} />
                {is_owner && profit ? (
                    <StatCard
                        label="Laba Kotor"
                        value={formatRupiah(profit.laba_kotor)}
                        icon={TrendingUp}
                        tone="success"
                        hint={`Modal ${formatRupiah(profit.modal)}`}
                    />
                ) : (
                    <StatCard label="Total Diskon" value={formatRupiah(summary.diskon)} icon={Receipt} />
                )}
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
                {/* By category */}
                <div className="border-border bg-card rounded-xl border p-5">
                    <div className="mb-4 flex items-center justify-between">
                        <h2 className="font-display font-semibold">Penjualan per Kategori</h2>
                        <a href={exportUrl('kategori')} className="text-primary text-xs hover:underline">
                            Ekspor CSV
                        </a>
                    </div>
                    {by_category.length === 0 ? (
                        <p className="text-muted-foreground py-8 text-center text-sm">Tidak ada data.</p>
                    ) : (
                        <div className="space-y-3">
                            {by_category.map((c, i) => (
                                <div key={i}>
                                    <div className="mb-1 flex items-center justify-between text-sm">
                                        <CategoryBadge name={c.name} color={c.color} />
                                        <span className="tabular font-medium">{formatRupiah(c.total)}</span>
                                    </div>
                                    <div className="bg-accent h-2 overflow-hidden rounded-full">
                                        <div
                                            className="h-full rounded-full"
                                            style={{ width: `${(c.total / maxCat) * 100}%`, backgroundColor: c.color }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Top products */}
                <div className="border-border bg-card rounded-xl border p-5">
                    <div className="mb-4 flex items-center justify-between">
                        <h2 className="font-display font-semibold">Barang Terlaris</h2>
                        <a href={exportUrl('terlaris')} className="text-primary text-xs hover:underline">
                            Ekspor CSV
                        </a>
                    </div>
                    {top_products.length === 0 ? (
                        <p className="text-muted-foreground py-8 text-center text-sm">Tidak ada data.</p>
                    ) : (
                        <table className="w-full text-sm">
                            <tbody>
                                {top_products.map((p, i) => (
                                    <tr key={i} className="border-border border-b last:border-0">
                                        <td className="py-2">{p.name}</td>
                                        <td className="tabular text-muted-foreground py-2 text-right">
                                            {formatQty(p.qty)} {p.unit}
                                        </td>
                                        <td className="tabular py-2 text-right font-medium">{formatRupiah(p.total)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Receivables + inventory */}
            <div className="mt-4 grid gap-4 lg:grid-cols-2">
                <div className="border-border bg-card rounded-xl border p-5">
                    <div className="mb-4 flex items-center justify-between">
                        <div>
                            <h2 className="font-display font-semibold">Laporan Piutang</h2>
                            <p className="text-muted-foreground text-sm">Total {formatRupiah(receivables.total)}</p>
                        </div>
                        <a href={exportUrl('piutang')} className="text-primary text-xs hover:underline">
                            Ekspor CSV
                        </a>
                    </div>
                    {receivables.customers.length === 0 ? (
                        <p className="text-muted-foreground py-8 text-center text-sm">Tidak ada piutang. 🎉</p>
                    ) : (
                        <table className="w-full text-sm">
                            <tbody>
                                {receivables.customers.map((c) => (
                                    <tr key={c.id} className="border-border border-b last:border-0">
                                        <td className="py-2">
                                            <div className="font-medium">{c.name}</div>
                                            <div className="text-muted-foreground text-xs">{c.phone ?? '—'}</div>
                                        </td>
                                        <td className="tabular text-destructive py-2 text-right font-semibold">{formatRupiah(c.debt)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {is_owner && inventory_value !== null && (
                    <div className="border-border bg-card flex flex-col justify-center gap-4 rounded-xl border p-5">
                        <StatCard label="Nilai Persediaan (Modal)" value={formatRupiah(inventory_value)} icon={Boxes} tone="success" />
                        {profit && <StatCard label="Modal Terjual (HPP)" value={formatRupiah(profit.modal)} icon={Wallet} />}
                    </div>
                )}
            </div>
        </PosLayout>
    );
}
