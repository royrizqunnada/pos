import PosLayout from '@/layouts/pos-layout';
import { formatDate, formatQty, formatRupiah } from '@/lib/format';
import { Link } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';

interface Item {
    name: string | null;
    qty: number;
    cost_price: number;
    subtotal: number;
}
interface Props {
    purchase: {
        id: number;
        ref_no: string;
        supplier: string | null;
        cashier: string | null;
        note: string | null;
        total: number;
        purchased_at: string;
        items: Item[];
    };
}

export default function PembelianShow({ purchase }: Props) {
    return (
        <PosLayout title={`Pembelian ${purchase.ref_no}`}>
            <Link href="/pembelian" className="text-muted-foreground hover:text-foreground mb-4 inline-flex items-center gap-1 text-sm">
                <ArrowLeft className="h-4 w-4" /> Kembali
            </Link>

            <div className="grid gap-4 lg:grid-cols-3">
                <div className="border-border bg-card rounded-xl border p-5">
                    <h2 className="font-display text-lg font-semibold">Detail</h2>
                    <dl className="mt-3 space-y-2 text-sm">
                        <div className="flex justify-between gap-4">
                            <dt className="text-muted-foreground">No. Ref</dt>
                            <dd className="font-mono">{purchase.ref_no}</dd>
                        </div>
                        <div className="flex justify-between gap-4">
                            <dt className="text-muted-foreground">Pemasok</dt>
                            <dd>{purchase.supplier ?? '—'}</dd>
                        </div>
                        <div className="flex justify-between gap-4">
                            <dt className="text-muted-foreground">Tanggal</dt>
                            <dd>{formatDate(purchase.purchased_at)}</dd>
                        </div>
                        <div className="flex justify-between gap-4">
                            <dt className="text-muted-foreground">Dicatat oleh</dt>
                            <dd>{purchase.cashier ?? '—'}</dd>
                        </div>
                        {purchase.note && (
                            <div className="flex justify-between gap-4">
                                <dt className="text-muted-foreground">Catatan</dt>
                                <dd className="text-right">{purchase.note}</dd>
                            </div>
                        )}
                    </dl>
                </div>

                <div className="border-border bg-card rounded-xl border lg:col-span-2">
                    <h2 className="border-border font-display border-b px-5 py-3 font-semibold">Barang</h2>
                    <table className="w-full text-sm">
                        <tbody>
                            {purchase.items.map((it, i) => (
                                <tr key={i} className="border-border border-b last:border-0">
                                    <td className="px-5 py-2.5">{it.name}</td>
                                    <td className="tabular text-muted-foreground px-5 py-2.5 text-right">
                                        {formatQty(it.qty)} × {formatRupiah(it.cost_price)}
                                    </td>
                                    <td className="tabular px-5 py-2.5 text-right font-medium">{formatRupiah(it.subtotal)}</td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr className="border-border border-t">
                                <td colSpan={2} className="font-display px-5 py-3 text-right font-semibold">
                                    Total
                                </td>
                                <td className="font-display text-primary tabular px-5 py-3 text-right text-lg font-bold">
                                    {formatRupiah(purchase.total)}
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
        </PosLayout>
    );
}
