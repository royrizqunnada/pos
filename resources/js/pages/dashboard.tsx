import { StatCard } from '@/components/pos/stat-card';
import { Badge } from '@/components/ui/badge';
import PosLayout from '@/layouts/pos-layout';
import { formatQty, formatRupiah } from '@/lib/format';
import { Link } from '@inertiajs/react';
import { AlertTriangle, ArrowRight, Receipt, ShoppingBag, TrendingUp, Wallet } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

interface Props {
    kpi: {
        omzet_hari_ini: number;
        transaksi_hari_ini: number;
        total_piutang: number;
        stok_menipis: number;
        laba_hari_ini: number | null;
    };
    chart: { date: string; label: string; total: number }[];
    top_products: { name: string; unit: string; qty: number; total: number }[];
    recent_sales: { id: number; invoice_no: string; customer: string; total: number; status: string; created_at: string }[];
    is_owner: boolean;
}

export default function Dashboard({ kpi, chart, top_products, recent_sales, is_owner }: Props) {
    return (
        <PosLayout title="Dashboard">
            <div className="mb-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard label="Omzet Hari Ini" value={formatRupiah(kpi.omzet_hari_ini)} icon={ShoppingBag} tone="amber" />
                <StatCard label="Transaksi Hari Ini" value={String(kpi.transaksi_hari_ini)} icon={Receipt} />
                {is_owner ? (
                    <StatCard label="Laba Kotor Hari Ini" value={formatRupiah(kpi.laba_hari_ini ?? 0)} icon={TrendingUp} tone="success" />
                ) : (
                    <StatCard label="Total Piutang" value={formatRupiah(kpi.total_piutang)} icon={Wallet} tone="danger" />
                )}
                <StatCard
                    label="Stok Menipis"
                    value={String(kpi.stok_menipis)}
                    icon={AlertTriangle}
                    tone={kpi.stok_menipis > 0 ? 'danger' : 'default'}
                />
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
                {/* Chart */}
                <div className="border-border bg-card rounded-xl border p-5 lg:col-span-2">
                    <h2 className="font-display mb-4 font-semibold">Omzet 7 Hari Terakhir</h2>
                    <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chart} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#E2DACE" vertical={false} />
                                <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#6E665A' }} axisLine={false} tickLine={false} />
                                <YAxis
                                    tick={{ fontSize: 12, fill: '#6E665A' }}
                                    axisLine={false}
                                    tickLine={false}
                                    width={70}
                                    tickFormatter={(v) => formatRupiah(v)}
                                />
                                <Tooltip
                                    cursor={{ fill: '#F7F3EC' }}
                                    formatter={(value) => [formatRupiah(value as number), 'Omzet']}
                                    contentStyle={{ borderRadius: 10, border: '1px solid #E2DACE', fontSize: 13 }}
                                />
                                <Bar dataKey="total" radius={[6, 6, 0, 0]} maxBarSize={48}>
                                    {chart.map((_, i) => (
                                        <Cell key={i} fill={i === chart.length - 1 ? '#E15A12' : '#D8CEBF'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Top products */}
                <div className="border-border bg-card rounded-xl border p-5">
                    <h2 className="font-display mb-4 font-semibold">Barang Terlaris (30 hari)</h2>
                    {top_products.length === 0 ? (
                        <p className="text-muted-foreground py-8 text-center text-sm">Belum ada penjualan.</p>
                    ) : (
                        <ol className="space-y-3">
                            {top_products.map((p, i) => {
                                const maxQty = Math.max(1, ...top_products.map((x) => x.qty));
                                return (
                                    <li key={i} className="flex items-center gap-3">
                                        <span className="bg-accent text-foreground flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-semibold">
                                            {i + 1}
                                        </span>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center justify-between gap-2">
                                                <span className="truncate text-sm font-medium">{p.name}</span>
                                                <span className="text-muted-foreground tabular shrink-0 text-xs">
                                                    {formatQty(p.qty)} {p.unit}
                                                </span>
                                            </div>
                                            <div className="bg-accent mt-1 h-1.5 overflow-hidden rounded-full">
                                                <div className="bg-primary h-full rounded-full" style={{ width: `${(p.qty / maxQty) * 100}%` }} />
                                            </div>
                                        </div>
                                    </li>
                                );
                            })}
                        </ol>
                    )}
                </div>
            </div>

            {/* Recent sales */}
            <div className="border-border bg-card mt-4 overflow-hidden rounded-xl border">
                <div className="border-border flex items-center justify-between border-b px-5 py-3">
                    <h2 className="font-display font-semibold">Transaksi Terbaru</h2>
                    <Link href="/kasir" className="text-primary inline-flex items-center gap-1 text-sm hover:underline">
                        Buka Kasir <ArrowRight className="h-4 w-4" />
                    </Link>
                </div>
                {recent_sales.length === 0 ? (
                    <p className="text-muted-foreground py-8 text-center text-sm">Belum ada transaksi.</p>
                ) : (
                    <table className="w-full text-sm">
                        <tbody>
                            {recent_sales.map((s) => (
                                <tr key={s.id} className="border-border border-b last:border-0">
                                    <td className="px-5 py-2.5 font-mono text-xs">{s.invoice_no}</td>
                                    <td className="px-5 py-2.5">{s.customer}</td>
                                    <td className="px-5 py-2.5">
                                        <Badge variant={s.status === 'utang' ? 'destructive' : 'secondary'}>{s.status}</Badge>
                                    </td>
                                    <td className="tabular px-5 py-2.5 text-right font-medium">{formatRupiah(s.total)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </PosLayout>
    );
}
