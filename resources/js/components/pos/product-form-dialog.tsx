import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { type Category, type Product, type Unit } from '@/types';
import { useForm } from '@inertiajs/react';
import { useEffect } from 'react';

interface ProductFormDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    product?: Product | null;
    categories: Category[];
    units: Unit[];
}

type ProductForm = {
    name: string;
    sku: string;
    barcode: string;
    category_id: string;
    unit_id: string;
    cost_price: number | string;
    sell_price: number | string;
    wholesale_price: number | string;
    wholesale_min_qty: number | string;
    stock: number | string;
    min_stock: number | string;
    is_active: boolean;
};

function FieldError({ message }: { message?: string }) {
    if (!message) return null;
    return <p className="text-destructive mt-1 text-xs">{message}</p>;
}

export function ProductFormDialog({ open, onOpenChange, product, categories, units }: ProductFormDialogProps) {
    const isEdit = !!product;

    const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm<ProductForm>({
        name: '',
        sku: '',
        barcode: '',
        category_id: '',
        unit_id: '',
        cost_price: '',
        sell_price: '',
        wholesale_price: '',
        wholesale_min_qty: '',
        stock: '',
        min_stock: '0',
        is_active: true,
    });

    useEffect(() => {
        if (!open) return;
        clearErrors();
        if (product) {
            setData({
                name: product.name,
                sku: product.sku ?? '',
                barcode: product.barcode ?? '',
                category_id: String(product.category_id),
                unit_id: String(product.unit_id),
                cost_price: product.cost_price ?? '',
                sell_price: product.sell_price,
                wholesale_price: product.wholesale_price ?? '',
                wholesale_min_qty: product.wholesale_min_qty ?? '',
                stock: product.stock,
                min_stock: product.min_stock,
                is_active: product.is_active,
            });
        } else {
            reset();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, product]);

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        const onSuccess = () => onOpenChange(false);
        if (isEdit && product) {
            put(`/barang/${product.id}`, { onSuccess, preserveScroll: true });
        } else {
            post('/barang', { onSuccess, preserveScroll: true });
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>{isEdit ? 'Edit Barang' : 'Tambah Barang'}</DialogTitle>
                    <DialogDescription>Lengkapi data barang. Harga dalam Rupiah tanpa desimal.</DialogDescription>
                </DialogHeader>

                <form onSubmit={submit} className="space-y-4">
                    <div>
                        <Label htmlFor="name">Nama Barang</Label>
                        <Input id="name" value={data.name} onChange={(e) => setData('name', e.target.value)} autoFocus />
                        <FieldError message={errors.name} />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <Label htmlFor="sku">SKU (opsional)</Label>
                            <Input id="sku" value={data.sku} onChange={(e) => setData('sku', e.target.value)} />
                            <FieldError message={errors.sku} />
                        </div>
                        <div>
                            <Label htmlFor="barcode">Barcode (opsional)</Label>
                            <Input id="barcode" value={data.barcode} onChange={(e) => setData('barcode', e.target.value)} />
                            <FieldError message={errors.barcode} />
                        </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <Label>Kategori</Label>
                            <Select value={data.category_id} onValueChange={(v) => setData('category_id', v)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Pilih kategori" />
                                </SelectTrigger>
                                <SelectContent>
                                    {categories.map((c) => (
                                        <SelectItem key={c.id} value={String(c.id)}>
                                            {c.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FieldError message={errors.category_id} />
                        </div>
                        <div>
                            <Label>Satuan</Label>
                            <Select value={data.unit_id} onValueChange={(v) => setData('unit_id', v)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Pilih satuan" />
                                </SelectTrigger>
                                <SelectContent>
                                    {units.map((u) => (
                                        <SelectItem key={u.id} value={String(u.id)}>
                                            {u.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FieldError message={errors.unit_id} />
                        </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <Label htmlFor="cost_price">Harga Modal (Rp)</Label>
                            <Input
                                id="cost_price"
                                type="number"
                                min={0}
                                value={data.cost_price}
                                onChange={(e) => setData('cost_price', e.target.value)}
                            />
                            <FieldError message={errors.cost_price} />
                        </div>
                        <div>
                            <Label htmlFor="sell_price">Harga Jual (Rp)</Label>
                            <Input
                                id="sell_price"
                                type="number"
                                min={0}
                                value={data.sell_price}
                                onChange={(e) => setData('sell_price', e.target.value)}
                            />
                            <FieldError message={errors.sell_price} />
                        </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <Label htmlFor="wholesale_price">Harga Grosir (Rp, opsional)</Label>
                            <Input
                                id="wholesale_price"
                                type="number"
                                min={0}
                                value={data.wholesale_price}
                                onChange={(e) => setData('wholesale_price', e.target.value)}
                            />
                            <FieldError message={errors.wholesale_price} />
                        </div>
                        <div>
                            <Label htmlFor="wholesale_min_qty">Min. Qty Grosir</Label>
                            <Input
                                id="wholesale_min_qty"
                                type="number"
                                min={0}
                                step="0.01"
                                value={data.wholesale_min_qty}
                                onChange={(e) => setData('wholesale_min_qty', e.target.value)}
                            />
                            <FieldError message={errors.wholesale_min_qty} />
                        </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        {!isEdit && (
                            <div>
                                <Label htmlFor="stock">Stok Awal</Label>
                                <Input
                                    id="stock"
                                    type="number"
                                    min={0}
                                    step="0.01"
                                    value={data.stock}
                                    onChange={(e) => setData('stock', e.target.value)}
                                />
                                <FieldError message={errors.stock} />
                            </div>
                        )}
                        <div>
                            <Label htmlFor="min_stock">Stok Minimum</Label>
                            <Input
                                id="min_stock"
                                type="number"
                                min={0}
                                step="0.01"
                                value={data.min_stock}
                                onChange={(e) => setData('min_stock', e.target.value)}
                            />
                            <FieldError message={errors.min_stock} />
                        </div>
                    </div>

                    <label className="flex items-center gap-2 text-sm">
                        <input
                            type="checkbox"
                            checked={data.is_active}
                            onChange={(e) => setData('is_active', e.target.checked)}
                            className="border-input h-4 w-4 rounded"
                        />
                        Barang aktif (tampil di kasir)
                    </label>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={processing}>
                            Batal
                        </Button>
                        <Button type="submit" disabled={processing}>
                            {isEdit ? 'Simpan Perubahan' : 'Tambah Barang'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
