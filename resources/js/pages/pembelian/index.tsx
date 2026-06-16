import { EmptyState } from '@/components/pos/empty-state';
import { Pagination } from '@/components/pos/pagination';
import { Button } from '@/components/ui/button';
import PosLayout from '@/layouts/pos-layout';
import { formatDate, formatRupiah } from '@/lib/format';
import { type Paginated } from '@/types';
import { Link } from '@inertiajs/react';
import { Plus, Truck } from 'lucide-react';

interface PurchaseRow {
    id: number;
    ref_no: string;
    supplier: string | null;
    total: number;
    items_count: number;
    purchased_at: string;
}

export default function PembelianIndex({ purchases }: { purchases: Paginated<PurchaseRow> }) {
    return (
        <PosLayout
            title="Pembelian"
            actions={
                <Button asChild>
                    <Link href="/pembelian/baru">
                        <Plus className="h-4 w-4" /> Pembelian Baru
                    </Link>
                </Button>
            }
        >
            <div className="border-border bg-card overflow-hidden rounded-xl border">
                {purchases.data.length === 0 ? (
                    <EmptyState
                        icon={Truck}
                        title="Belum ada pembelian"
                        description="Catat pembelian dari pemasok untuk menambah stok."
                        action={
                            <Button asChild>
                                <Link href="/pembelian/baru">
                                    <Plus className="h-4 w-4" /> Pembelian Baru
                                </Link>
                            </Button>
                        }
                    />
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-border bg-surface-alt text-muted-foreground border-b text-left text-xs tracking-wide uppercase">
                                    <th className="px-4 py-3 font-medium">No. Ref</th>
                                    <th className="px-4 py-3 font-medium">Pemasok</th>
                                    <th className="px-4 py-3 font-medium">Tanggal</th>
                                    <th className="px-4 py-3 text-right font-medium">Item</th>
                                    <th className="px-4 py-3 text-right font-medium">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {purchases.data.map((p) => (
                                    <tr key={p.id} className="border-border hover:bg-surface-alt/50 border-b last:border-0">
                                        <td className="px-4 py-3">
                                            <Link
                                                href={`/pembelian/${p.id}`}
                                                className="text-foreground hover:text-primary font-mono text-xs font-medium"
                                            >
                                                {p.ref_no}
                                            </Link>
                                        </td>
                                        <td className="px-4 py-3">{p.supplier ?? '—'}</td>
                                        <td className="text-muted-foreground px-4 py-3">{formatDate(p.purchased_at)}</td>
                                        <td className="tabular px-4 py-3 text-right">{p.items_count}</td>
                                        <td className="tabular px-4 py-3 text-right font-medium">{formatRupiah(p.total)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
                <Pagination paginator={purchases} />
            </div>
        </PosLayout>
    );
}
