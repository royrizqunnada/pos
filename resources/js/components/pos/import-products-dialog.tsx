import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useForm } from '@inertiajs/react';
import { Download, FileSpreadsheet } from 'lucide-react';
import { useEffect } from 'react';

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function ImportProductsDialog({ open, onOpenChange }: Props) {
    const { setData, post, processing, errors, reset, clearErrors } = useForm<{ file: File | null }>({ file: null });

    useEffect(() => {
        if (open) {
            clearErrors();
            reset();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/barang/impor', { forceFormData: true, onSuccess: () => onOpenChange(false) });
    };

    // Laravel nests file array errors under file.0 etc.
    const fileError = errors.file ?? (errors as Record<string, string>)['file.0'];

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Impor Barang dari Excel</DialogTitle>
                    <DialogDescription>
                        Unggah file <strong>.xlsx</strong> atau <strong>.csv</strong>. Barang baru otomatis dibuat, stok dari kolom “stok” langsung
                        masuk. Kategori &amp; satuan baru dibuat otomatis.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={submit} className="space-y-4">
                    <a href="/barang/template-impor" className="text-primary inline-flex items-center gap-2 text-sm font-medium hover:underline">
                        <Download className="h-4 w-4" /> Unduh template (.csv)
                    </a>

                    <div>
                        <Label htmlFor="file">File Excel / CSV</Label>
                        <input
                            id="file"
                            type="file"
                            accept=".xlsx,.csv"
                            onChange={(e) => setData('file', e.target.files?.[0] ?? null)}
                            className="border-input bg-background file:bg-accent mt-1 block w-full rounded-md border text-sm file:mr-3 file:border-0 file:px-3 file:py-2 file:text-sm file:font-medium"
                        />
                        {fileError && <p className="text-destructive mt-1 text-xs">{fileError}</p>}
                    </div>

                    <div className="bg-surface-alt text-muted-foreground rounded-lg p-3 text-xs">
                        Kolom:{' '}
                        <span className="font-mono">
                            nama, kategori, satuan, sku, barcode, harga_modal, harga_jual, harga_grosir, min_qty_grosir, stok, stok_minimum
                        </span>
                        . Hanya <strong>nama</strong> &amp; <strong>harga_jual</strong> yang wajib.
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={processing}>
                            Batal
                        </Button>
                        <Button type="submit" disabled={processing}>
                            <FileSpreadsheet className="h-4 w-4" /> Impor
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
