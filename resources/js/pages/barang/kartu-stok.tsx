import { EmptyState } from '@/components/pos/empty-state';
import { Pagination } from '@/components/pos/pagination';
import PosLayout from '@/layouts/pos-layout';
import { formatDateTime, formatQty } from '@/lib/format';
import { cn } from '@/lib/utils';
import { type Paginated } from '@/types';
import { Link } from '@inertiajs/react';
import { ArrowLeft, ClipboardList } from 'lucide-react';

interface Movement {
    id: number;
    type: string;
    qty_change: number;
    stock_after: number;
    note: string | null;
    created_at: string | null;
}

interface Props {
    product: { id: number; name: string; unit_name: string; stock: number };
    movements: Paginated<Movement>;
}

const TYPE_LABEL: Record<string, string> = {
    initial: 'Stok Awal',
    sale: 'Penjualan',
    purchase: 'Pembelian',
    adjustment: 'Penyesuaian',
    return: 'Retur / Batal',
    payment: 'Pembayaran',
};

export default function KartuStok({ product, movements }: Props) {
    return (
        <PosLayout title={`Kartu Stok — ${product.name}`}>
            <Link href="/barang" className="text-muted-foreground hover:text-foreground mb-4 inline-flex items-center gap-1 text-sm">
                <ArrowLeft className="h-4 w-4" /> Kembali ke barang
            </Link>

            <div className="border-border bg-card mb-4 rounded-xl border p-5">
                <div className="text-muted-foreground text-sm">Stok saat ini</div>
                <div className="font-display tabular text-2xl font-semibold">
                    {formatQty(product.stock)} {product.unit_name}
                </div>
            </div>

            <div className="border-border bg-card overflow-hidden rounded-xl border">
                {movements.data.length === 0 ? (
                    <EmptyState icon={ClipboardList} title="Belum ada mutasi" description="Riwayat keluar-masuk stok akan tampil di sini." />
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-border bg-surface-alt text-muted-foreground border-b text-left text-xs tracking-wide uppercase">
                                    <th className="px-4 py-3 font-medium">Waktu</th>
                                    <th className="px-4 py-3 font-medium">Jenis</th>
                                    <th className="px-4 py-3 font-medium">Keterangan</th>
                                    <th className="px-4 py-3 text-right font-medium">Perubahan</th>
                                    <th className="px-4 py-3 text-right font-medium">Stok Akhir</th>
                                </tr>
                            </thead>
                            <tbody>
                                {movements.data.map((m) => {
                                    const positive = m.qty_change >= 0;
                                    return (
                                        <tr key={m.id} className="border-border border-b last:border-0">
                                            <td className="text-muted-foreground px-4 py-3">{formatDateTime(m.created_at)}</td>
                                            <td className="px-4 py-3">{TYPE_LABEL[m.type] ?? m.type}</td>
                                            <td className="text-muted-foreground px-4 py-3">{m.note ?? '—'}</td>
                                            <td
                                                className={cn(
                                                    'tabular px-4 py-3 text-right font-medium',
                                                    positive ? 'text-success' : 'text-destructive',
                                                )}
                                            >
                                                {positive ? '+' : ''}
                                                {formatQty(m.qty_change)}
                                            </td>
                                            <td className="tabular px-4 py-3 text-right">{formatQty(m.stock_after)}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
                <Pagination paginator={movements} />
            </div>
        </PosLayout>
    );
}
