import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { formatDateTime, formatQty, formatRupiah } from '@/lib/format';
import { type ReceiptData } from '@/types';
import { Printer, X } from 'lucide-react';

interface ReceiptDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    receipt: ReceiptData | null;
}

/** Printable thermal-style receipt (58/80mm) shown after checkout. */
export function ReceiptDialog({ open, onOpenChange, receipt }: ReceiptDialogProps) {
    if (!receipt) return null;

    const isDebt = receipt.status === 'utang';

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[92vh] overflow-y-auto p-0 sm:max-w-md">
                <DialogTitle className="sr-only">Struk {receipt.invoice_no}</DialogTitle>

                <div className="receipt-print bg-white px-6 py-6 font-mono text-[13px] leading-relaxed text-black">
                    <div className="text-center">
                        <div className="font-display text-lg font-bold tracking-wide uppercase">{receipt.store.name}</div>
                        {receipt.store.address && <div className="text-xs">{receipt.store.address}</div>}
                        {receipt.store.phone && <div className="text-xs">Telp. {receipt.store.phone}</div>}
                    </div>

                    <div className="my-2 border-t border-dashed border-black/60" />

                    <div className="flex justify-between text-xs">
                        <span>No</span>
                        <span>{receipt.invoice_no}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                        <span>Tanggal</span>
                        <span>{formatDateTime(receipt.created_at)}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                        <span>Kasir</span>
                        <span>{receipt.cashier ?? '-'}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                        <span>Pelanggan</span>
                        <span>{receipt.customer ?? 'Umum'}</span>
                    </div>

                    <div className="my-2 border-t border-dashed border-black/60" />

                    <table className="w-full text-xs">
                        <tbody>
                            {receipt.items.map((it, i) => (
                                <tr key={i} className="align-top">
                                    <td className="py-0.5">
                                        <div>{it.name}</div>
                                        <div className="text-[11px]">
                                            {formatQty(it.qty)} {it.unit} x {formatRupiah(it.price)}
                                        </div>
                                        {it.discount > 0 && <div className="text-[11px]">Diskon -{formatRupiah(it.discount)}</div>}
                                    </td>
                                    <td className="py-0.5 text-right whitespace-nowrap">{formatRupiah(it.subtotal)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    <div className="my-2 border-t border-dashed border-black/60" />

                    <div className="flex justify-between">
                        <span>Subtotal</span>
                        <span>{formatRupiah(receipt.subtotal)}</span>
                    </div>
                    {receipt.discount > 0 && (
                        <div className="flex justify-between">
                            <span>Diskon</span>
                            <span>-{formatRupiah(receipt.discount)}</span>
                        </div>
                    )}
                    <div className="flex justify-between text-sm font-bold">
                        <span>TOTAL</span>
                        <span>{formatRupiah(receipt.total)}</span>
                    </div>

                    {isDebt ? (
                        <div className="mt-2 border border-black/70 py-1 text-center text-sm font-bold">*** UTANG / BON ***</div>
                    ) : (
                        <>
                            <div className="flex justify-between">
                                <span>Tunai</span>
                                <span>{formatRupiah(receipt.paid_amount)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Kembali</span>
                                <span>{formatRupiah(receipt.change_amount)}</span>
                            </div>
                        </>
                    )}

                    <div className="my-2 border-t border-dashed border-black/60" />

                    {receipt.store.footer && <div className="text-center text-[11px] whitespace-pre-line">{receipt.store.footer}</div>}
                    <div className="mt-3 text-center text-[18px] leading-none text-black/40">— — — — — — — —</div>
                </div>

                <div className="no-print border-border flex gap-2 border-t p-4">
                    <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
                        <X className="h-4 w-4" /> Tutup
                    </Button>
                    <Button className="flex-1" onClick={() => window.print()}>
                        <Printer className="h-4 w-4" /> Cetak Struk
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
