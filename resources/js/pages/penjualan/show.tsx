import { ReceiptDialog } from '@/components/pos/receipt';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import PosLayout from '@/layouts/pos-layout';
import { formatDateTime, formatQty, formatRupiah } from '@/lib/format';
import { type ReceiptData } from '@/types';
import { Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Ban, Printer } from 'lucide-react';
import { useState } from 'react';

interface Props {
    sale: { id: number; invoice_no: string; created_at: string; voided: boolean; voided_at: string | null; void_reason: string | null };
    receipt: ReceiptData;
    can_void: boolean;
}

export default function PenjualanShow({ sale, receipt, can_void }: Props) {
    const [receiptOpen, setReceiptOpen] = useState(false);
    const [voidOpen, setVoidOpen] = useState(false);
    const voidForm = useForm({ reason: '' });

    const submitVoid = (e: React.FormEvent) => {
        e.preventDefault();
        voidForm.post(`/penjualan/${sale.id}/batal`, { preserveScroll: true, onSuccess: () => setVoidOpen(false) });
    };

    return (
        <PosLayout
            title={`Transaksi ${sale.invoice_no}`}
            actions={
                <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={() => setReceiptOpen(true)}>
                        <Printer className="h-4 w-4" /> Cetak Struk
                    </Button>
                    {can_void && (
                        <Button variant="destructive" onClick={() => setVoidOpen(true)}>
                            <Ban className="h-4 w-4" /> Batalkan
                        </Button>
                    )}
                </div>
            }
        >
            <Link href="/penjualan" className="text-muted-foreground hover:text-foreground mb-4 inline-flex items-center gap-1 text-sm">
                <ArrowLeft className="h-4 w-4" /> Kembali ke riwayat
            </Link>

            {sale.voided && (
                <div className="border-destructive/30 bg-destructive/10 text-destructive mb-4 flex items-center gap-2 rounded-lg border px-4 py-3 text-sm">
                    <Ban className="h-4 w-4 shrink-0" />
                    <span>
                        Transaksi ini telah <strong>dibatalkan</strong> {sale.voided_at ? `pada ${formatDateTime(sale.voided_at)}` : ''}
                        {sale.void_reason ? ` — ${sale.void_reason}` : ''}. Stok sudah dikembalikan.
                    </span>
                </div>
            )}

            <div className="grid gap-4 lg:grid-cols-3">
                <div className="border-border bg-card rounded-xl border p-5">
                    <h2 className="font-display text-lg font-semibold">Detail</h2>
                    <dl className="mt-3 space-y-2 text-sm">
                        <Row label="No. Invoice" value={receipt.invoice_no} mono />
                        <Row label="Waktu" value={formatDateTime(receipt.created_at)} />
                        <Row label="Kasir" value={receipt.cashier ?? '—'} />
                        <Row label="Pelanggan" value={receipt.customer ?? 'Umum'} />
                        <Row label="Metode" value={receipt.payment_method === 'utang' ? 'Utang' : 'Tunai'} />
                    </dl>
                </div>

                <div className="border-border bg-card rounded-xl border lg:col-span-2">
                    <h2 className="border-border font-display border-b px-5 py-3 font-semibold">Barang</h2>
                    <table className="w-full text-sm">
                        <tbody>
                            {receipt.items.map((it, i) => (
                                <tr key={i} className="border-border border-b last:border-0">
                                    <td className="px-5 py-2.5">
                                        <div>{it.name}</div>
                                        <div className="text-muted-foreground text-xs">
                                            {formatQty(it.qty)} {it.unit} × {formatRupiah(it.price)}
                                        </div>
                                    </td>
                                    <td className="tabular px-5 py-2.5 text-right font-medium">{formatRupiah(it.subtotal)}</td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            {receipt.discount > 0 && (
                                <tr>
                                    <td className="text-muted-foreground px-5 py-1 text-right">Diskon</td>
                                    <td className="tabular px-5 py-1 text-right">-{formatRupiah(receipt.discount)}</td>
                                </tr>
                            )}
                            <tr className="border-border border-t">
                                <td className="font-display px-5 py-3 text-right font-semibold">Total</td>
                                <td className="font-display text-primary tabular px-5 py-3 text-right text-lg font-bold">
                                    {formatRupiah(receipt.total)}
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>

            <ReceiptDialog open={receiptOpen} onOpenChange={setReceiptOpen} receipt={receipt} />

            <Dialog open={voidOpen} onOpenChange={setVoidOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Batalkan transaksi?</DialogTitle>
                        <DialogDescription>
                            Stok barang akan dikembalikan dan utang pelanggan (jika ada) dikurangi. Tindakan ini tidak dapat dibatalkan.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={submitVoid} className="space-y-4">
                        <div>
                            <Label htmlFor="reason">Alasan (opsional)</Label>
                            <Input id="reason" value={voidForm.data.reason} onChange={(e) => voidForm.setData('reason', e.target.value)} />
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setVoidOpen(false)} disabled={voidForm.processing}>
                                Batal
                            </Button>
                            <Button type="submit" variant="destructive" disabled={voidForm.processing}>
                                Ya, Batalkan
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </PosLayout>
    );
}

function Row({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
    return (
        <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">{label}</dt>
            <dd className={mono ? 'font-mono' : ''}>{value}</dd>
        </div>
    );
}
