import { CategoryBadge } from '@/components/pos/category-badge';
import { ConfirmDialog } from '@/components/pos/confirm-dialog';
import { EmptyState } from '@/components/pos/empty-state';
import { Pagination } from '@/components/pos/pagination';
import { ProductFormDialog } from '@/components/pos/product-form-dialog';
import { StatCard } from '@/components/pos/stat-card';
import { StockDialog } from '@/components/pos/stock-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import PosLayout from '@/layouts/pos-layout';
import { formatQty, formatRupiah } from '@/lib/format';
import { type Category, type Paginated, type Product, type Unit } from '@/types';
import { router, useForm } from '@inertiajs/react';
import { AlertTriangle, Boxes, PackagePlus, Pencil, Plus, Search, SlidersHorizontal, Trash2, Wallet } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface Props {
    products: Paginated<Product>;
    categories: Category[];
    units: Unit[];
    filters: { search: string; category_id: number | null; low_stock: boolean };
    summary: { total_products: number; low_stock_count: number; inventory_value: number | null };
    can: { manage: boolean; view_cost: boolean };
}

export default function BarangIndex({ products, categories, units, filters, summary, can }: Props) {
    const [search, setSearch] = useState(filters.search ?? '');
    const first = useRef(true);

    // Debounced search.
    useEffect(() => {
        if (first.current) {
            first.current = false;
            return;
        }
        const t = setTimeout(() => {
            applyFilters({ search });
        }, 350);
        return () => clearTimeout(t);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search]);

    function applyFilters(next: Partial<{ search: string; category_id: number | null; low_stock: boolean }>) {
        const params = {
            search: next.search ?? search,
            category_id: next.category_id !== undefined ? next.category_id : filters.category_id,
            low_stock: next.low_stock !== undefined ? next.low_stock : filters.low_stock,
        };
        router.get('/barang', cleanParams(params), { preserveState: true, replace: true, preserveScroll: true });
    }

    // dialogs
    const [formOpen, setFormOpen] = useState(false);
    const [editing, setEditing] = useState<Product | null>(null);
    const [stockOpen, setStockOpen] = useState(false);
    const [stockMode, setStockMode] = useState<'add' | 'adjust'>('add');
    const [stockProduct, setStockProduct] = useState<Product | null>(null);
    const [deleting, setDeleting] = useState<Product | null>(null);
    const destroy = useForm({});

    const openCreate = () => {
        setEditing(null);
        setFormOpen(true);
    };
    const openEdit = (p: Product) => {
        setEditing(p);
        setFormOpen(true);
    };
    const openStock = (p: Product, mode: 'add' | 'adjust') => {
        setStockProduct(p);
        setStockMode(mode);
        setStockOpen(true);
    };

    const confirmDelete = () => {
        if (!deleting) return;
        destroy.delete(`/barang/${deleting.id}`, { preserveScroll: true, onSuccess: () => setDeleting(null) });
    };

    return (
        <PosLayout
            title="Barang & Stok"
            actions={
                can.manage && (
                    <Button onClick={openCreate}>
                        <Plus className="h-4 w-4" /> Tambah Barang
                    </Button>
                )
            }
        >
            {/* Summary */}
            <div className="mb-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <StatCard label="Jenis Barang" value={String(summary.total_products)} icon={Boxes} />
                <StatCard
                    label="Stok Menipis"
                    value={String(summary.low_stock_count)}
                    icon={AlertTriangle}
                    tone={summary.low_stock_count > 0 ? 'danger' : 'default'}
                />
                {can.view_cost && summary.inventory_value !== null && (
                    <StatCard label="Nilai Persediaan" value={formatRupiah(summary.inventory_value)} icon={Wallet} tone="success" />
                )}
            </div>

            {/* Filters */}
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="relative flex-1">
                    <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
                    <Input placeholder="Cari nama, SKU, atau barcode…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
                </div>
                <Select
                    value={filters.category_id ? String(filters.category_id) : 'all'}
                    onValueChange={(v) => applyFilters({ category_id: v === 'all' ? null : Number(v) })}
                >
                    <SelectTrigger className="sm:w-56">
                        <SelectValue placeholder="Semua kategori" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Semua kategori</SelectItem>
                        {categories.map((c) => (
                            <SelectItem key={c.id} value={String(c.id)}>
                                {c.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Button
                    type="button"
                    variant={filters.low_stock ? 'default' : 'outline'}
                    onClick={() => applyFilters({ low_stock: !filters.low_stock })}
                >
                    <SlidersHorizontal className="h-4 w-4" /> Stok Menipis
                </Button>
            </div>

            {/* Table */}
            <div className="border-border bg-card overflow-hidden rounded-xl border">
                {products.data.length === 0 ? (
                    <EmptyState
                        icon={Boxes}
                        title="Belum ada barang"
                        description="Tambahkan barang material untuk mulai berjualan."
                        action={
                            can.manage && (
                                <Button onClick={openCreate}>
                                    <Plus className="h-4 w-4" /> Tambah Barang
                                </Button>
                            )
                        }
                    />
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-border bg-surface-alt text-muted-foreground border-b text-left text-xs tracking-wide uppercase">
                                    <th className="px-4 py-3 font-medium">Barang</th>
                                    <th className="px-4 py-3 font-medium">Kategori</th>
                                    <th className="px-4 py-3 text-right font-medium">Harga Jual</th>
                                    {can.view_cost && <th className="px-4 py-3 text-right font-medium">Harga Modal</th>}
                                    <th className="px-4 py-3 text-right font-medium">Stok</th>
                                    <th className="px-4 py-3 font-medium">Status</th>
                                    {can.manage && <th className="px-4 py-3 text-right font-medium">Aksi</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {products.data.map((p) => (
                                    <tr key={p.id} className="border-border hover:bg-surface-alt/50 border-b last:border-0">
                                        <td className="px-4 py-3">
                                            <div className="text-foreground font-medium">{p.name}</div>
                                            <div className="text-muted-foreground text-xs">
                                                {p.sku ?? '—'}
                                                {p.barcode ? ` · ${p.barcode}` : ''}
                                                {!p.is_active && <span className="text-destructive ml-2">(nonaktif)</span>}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            {p.category && <CategoryBadge name={p.category.name} color={p.category.color} />}
                                        </td>
                                        <td className="tabular px-4 py-3 text-right">
                                            <div className="font-medium">{formatRupiah(p.sell_price)}</div>
                                            {p.wholesale_price !== null && (
                                                <div className="text-muted-foreground text-xs">
                                                    grosir {formatRupiah(p.wholesale_price)} / ≥{formatQty(p.wholesale_min_qty)}
                                                </div>
                                            )}
                                        </td>
                                        {can.view_cost && (
                                            <td className="tabular text-muted-foreground px-4 py-3 text-right">{formatRupiah(p.cost_price)}</td>
                                        )}
                                        <td className="tabular px-4 py-3 text-right font-medium">
                                            {formatQty(p.stock)} {p.unit?.name}
                                        </td>
                                        <td className="px-4 py-3">
                                            {p.is_low_stock ? (
                                                <span className="bg-destructive/10 text-destructive inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold">
                                                    <AlertTriangle className="h-3 w-3" /> Menipis
                                                </span>
                                            ) : (
                                                <span className="bg-success/10 text-success inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold">
                                                    Aman
                                                </span>
                                            )}
                                        </td>
                                        {can.manage && (
                                            <td className="px-4 py-3">
                                                <div className="flex items-center justify-end gap-1">
                                                    <Button size="icon" variant="ghost" title="Tambah stok" onClick={() => openStock(p, 'add')}>
                                                        <PackagePlus className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        title="Penyesuaian stok"
                                                        onClick={() => openStock(p, 'adjust')}
                                                    >
                                                        <SlidersHorizontal className="h-4 w-4" />
                                                    </Button>
                                                    <Button size="icon" variant="ghost" title="Edit" onClick={() => openEdit(p)}>
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        title="Hapus"
                                                        className="text-destructive hover:text-destructive"
                                                        onClick={() => setDeleting(p)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
                <Pagination paginator={products} />
            </div>

            {can.manage && (
                <>
                    <ProductFormDialog open={formOpen} onOpenChange={setFormOpen} product={editing} categories={categories} units={units} />
                    <StockDialog open={stockOpen} onOpenChange={setStockOpen} product={stockProduct} mode={stockMode} />
                    <ConfirmDialog
                        open={!!deleting}
                        onOpenChange={(o) => !o && setDeleting(null)}
                        title="Hapus barang?"
                        description={deleting ? `"${deleting.name}" akan dihapus permanen.` : ''}
                        destructive
                        confirmLabel="Hapus"
                        processing={destroy.processing}
                        onConfirm={confirmDelete}
                    />
                </>
            )}
        </PosLayout>
    );
}

function cleanParams(params: Record<string, unknown>) {
    const out: Record<string, string> = {};
    for (const [k, v] of Object.entries(params)) {
        if (v === null || v === '' || v === false) continue;
        out[k] = String(v);
    }
    return out;
}
