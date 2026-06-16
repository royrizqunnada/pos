import { type CustomerLite } from '@/components/pos/customer-form-dialog';
import { PayDebtDialog } from '@/components/pos/pay-debt-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import PosLayout from '@/layouts/pos-layout';
import { formatDateTime, formatRupiah } from '@/lib/format';
import { Link } from '@inertiajs/react';
import { ArrowLeft, HandCoins } from 'lucide-react';
import { useState } from 'react';

interface SaleRow {
    id: number;
    invoice_no: string;
    created_at: string;
    total: number;
    status: 'lunas' | 'utang';
}
interface PaymentRow {
    id: number;
    amount: number;
    note: string | null;
    paid_at: string;
    cashier: string | null;
}

interface Props {
    customer: CustomerLite;
    sales: SaleRow[];
    payments: PaymentRow[];
}

export default function PelangganShow({ customer, sales, payments }: Props) {
    const [payOpen, setPayOpen] = useState(false);

    return (
        <PosLayout
            title={customer.name}
            actions={
                customer.debt > 0 && (
                    <Button onClick={() => setPayOpen(true)}>
                        <HandCoins className="h-4 w-4" /> Bayar Utang
                    </Button>
                )
            }
        >
            <Link href="/pelanggan" className="text-muted-foreground hover:text-foreground mb-4 inline-flex items-center gap-1 text-sm">
                <ArrowLeft className="h-4 w-4" /> Kembali ke daftar
            </Link>

            <div className="grid gap-4 lg:grid-cols-3">
                <div className="border-border bg-card rounded-xl border p-5">
                    <h2 className="font-display text-lg font-semibold">Info Pelanggan</h2>
                    <dl className="mt-3 space-y-2 text-sm">
                        <div className="flex justify-between gap-4">
                            <dt className="text-muted-foreground">Telepon</dt>
                            <dd>{customer.phone ?? '—'}</dd>
                        </div>
                        <div className="flex justify-between gap-4">
                            <dt className="text-muted-foreground">Alamat</dt>
                            <dd className="text-right">{customer.address ?? '—'}</dd>
                        </div>
                        <div className="flex justify-between gap-4">
                            <dt className="text-muted-foreground">Catatan</dt>
                            <dd className="text-right">{customer.note ?? '—'}</dd>
                        </div>
                        <div className="border-border flex justify-between gap-4 border-t pt-2">
                            <dt className="text-muted-foreground">Sisa Utang</dt>
                            <dd className="font-display text-destructive tabular text-lg font-bold">{formatRupiah(customer.debt)}</dd>
                        </div>
                    </dl>
                </div>

                <div className="border-border bg-card rounded-xl border lg:col-span-2">
                    <h2 className="border-border font-display border-b px-5 py-3 font-semibold">Riwayat Transaksi</h2>
                    {sales.length === 0 ? (
                        <p className="text-muted-foreground px-5 py-8 text-center text-sm">Belum ada transaksi.</p>
                    ) : (
                        <table className="w-full text-sm">
                            <tbody>
                                {sales.map((s) => (
                                    <tr key={s.id} className="border-border border-b last:border-0">
                                        <td className="px-5 py-2.5">
                                            <div className="font-mono text-xs">{s.invoice_no}</div>
                                            <div className="text-muted-foreground text-xs">{formatDateTime(s.created_at)}</div>
                                        </td>
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
            </div>

            <div className="border-border bg-card mt-4 rounded-xl border">
                <h2 className="border-border font-display border-b px-5 py-3 font-semibold">Riwayat Pembayaran Utang</h2>
                {payments.length === 0 ? (
                    <p className="text-muted-foreground px-5 py-8 text-center text-sm">Belum ada pembayaran.</p>
                ) : (
                    <table className="w-full text-sm">
                        <tbody>
                            {payments.map((p) => (
                                <tr key={p.id} className="border-border border-b last:border-0">
                                    <td className="px-5 py-2.5">
                                        <div>{formatDateTime(p.paid_at)}</div>
                                        <div className="text-muted-foreground text-xs">
                                            {p.cashier ?? '—'}
                                            {p.note ? ` · ${p.note}` : ''}
                                        </div>
                                    </td>
                                    <td className="tabular text-success px-5 py-2.5 text-right font-medium">{formatRupiah(p.amount)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            <PayDebtDialog open={payOpen} onOpenChange={setPayOpen} customer={customer} />
        </PosLayout>
    );
}
