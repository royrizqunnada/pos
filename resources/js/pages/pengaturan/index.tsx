import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import PosLayout from '@/layouts/pos-layout';
import { formatDateTime } from '@/lib/format';
import { type Role } from '@/types';
import { Link, useForm } from '@inertiajs/react';
import { History, Plus, Store, UserCog } from 'lucide-react';
import { useEffect, useState } from 'react';

interface UserRow {
    id: number;
    name: string;
    email: string;
    role: Role;
    is_active: boolean;
}

export interface LogRow {
    id: number;
    event: string;
    description: string;
    user: string;
    ip_address: string | null;
    created_at: string;
}

interface Props {
    setting: { store_name: string; store_address: string | null; store_phone: string | null; receipt_footer: string | null };
    users: UserRow[];
    logs: LogRow[];
}

export default function PengaturanIndex({ setting, users, logs }: Props) {
    const store = useForm({
        store_name: setting.store_name ?? '',
        store_address: setting.store_address ?? '',
        store_phone: setting.store_phone ?? '',
        receipt_footer: setting.receipt_footer ?? '',
    });

    const [userOpen, setUserOpen] = useState(false);
    const [editing, setEditing] = useState<UserRow | null>(null);
    const userForm = useForm<{ name: string; email: string; password: string; role: Role; is_active: boolean }>({
        name: '',
        email: '',
        password: '',
        role: 'kasir',
        is_active: true,
    });

    useEffect(() => {
        if (!userOpen) return;
        userForm.clearErrors();
        if (editing) {
            userForm.setData({ name: editing.name, email: editing.email, password: '', role: editing.role, is_active: editing.is_active });
        } else {
            userForm.reset();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userOpen, editing]);

    function saveStore(e: React.FormEvent) {
        e.preventDefault();
        store.put('/pengaturan/toko', { preserveScroll: true });
    }

    function saveUser(e: React.FormEvent) {
        e.preventDefault();
        const onSuccess = () => setUserOpen(false);
        if (editing) {
            userForm.put(`/pengaturan/pengguna/${editing.id}`, { onSuccess, preserveScroll: true });
        } else {
            userForm.post('/pengaturan/pengguna', { onSuccess, preserveScroll: true });
        }
    }

    return (
        <PosLayout title="Pengaturan">
            <div className="grid gap-4 lg:grid-cols-2">
                {/* Store profile */}
                <form onSubmit={saveStore} className="border-border bg-card rounded-xl border p-5">
                    <div className="mb-4 flex items-center gap-2">
                        <Store className="text-primary h-5 w-5" />
                        <h2 className="font-display font-semibold">Profil Toko</h2>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="store_name">Nama Toko</Label>
                            <Input id="store_name" value={store.data.store_name} onChange={(e) => store.setData('store_name', e.target.value)} />
                            {store.errors.store_name && <p className="text-destructive mt-1 text-xs">{store.errors.store_name}</p>}
                        </div>
                        <div>
                            <Label htmlFor="store_address">Alamat</Label>
                            <Input
                                id="store_address"
                                value={store.data.store_address}
                                onChange={(e) => store.setData('store_address', e.target.value)}
                            />
                        </div>
                        <div>
                            <Label htmlFor="store_phone">Telepon</Label>
                            <Input id="store_phone" value={store.data.store_phone} onChange={(e) => store.setData('store_phone', e.target.value)} />
                        </div>
                        <div>
                            <Label htmlFor="receipt_footer">Footer Struk</Label>
                            <textarea
                                id="receipt_footer"
                                rows={3}
                                value={store.data.receipt_footer}
                                onChange={(e) => store.setData('receipt_footer', e.target.value)}
                                className="border-input bg-background focus-visible:ring-ring flex w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:outline-hidden"
                            />
                        </div>
                        <Button type="submit" disabled={store.processing}>
                            Simpan Profil
                        </Button>
                    </div>
                </form>

                {/* Users */}
                <div className="border-border bg-card rounded-xl border p-5">
                    <div className="mb-4 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <UserCog className="text-primary h-5 w-5" />
                            <h2 className="font-display font-semibold">Akun Pengguna</h2>
                        </div>
                        <Button
                            size="sm"
                            onClick={() => {
                                setEditing(null);
                                setUserOpen(true);
                            }}
                        >
                            <Plus className="h-4 w-4" /> Tambah
                        </Button>
                    </div>
                    <table className="w-full text-sm">
                        <tbody>
                            {users.map((u) => (
                                <tr key={u.id} className="border-border border-b last:border-0">
                                    <td className="py-2.5">
                                        <div className="font-medium">{u.name}</div>
                                        <div className="text-muted-foreground text-xs">{u.email}</div>
                                    </td>
                                    <td className="py-2.5">
                                        <Badge variant={u.role === 'pemilik' ? 'default' : 'secondary'} className="capitalize">
                                            {u.role}
                                        </Badge>
                                    </td>
                                    <td className="py-2.5">
                                        {u.is_active ? (
                                            <span className="text-success text-xs font-medium">Aktif</span>
                                        ) : (
                                            <span className="text-destructive text-xs font-medium">Nonaktif</span>
                                        )}
                                    </td>
                                    <td className="py-2.5 text-right">
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => {
                                                setEditing(u);
                                                setUserOpen(true);
                                            }}
                                        >
                                            Kelola
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Activity log */}
            <div className="border-border bg-card mt-4 rounded-xl border p-5">
                <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <History className="text-primary h-5 w-5" />
                        <h2 className="font-display font-semibold">Log Aktivitas</h2>
                    </div>
                    <Link href="/pengaturan/log" className="text-primary text-sm font-medium hover:underline">
                        Lihat semua
                    </Link>
                </div>
                {logs.length === 0 ? (
                    <p className="text-muted-foreground py-6 text-center text-sm">Belum ada aktivitas tercatat.</p>
                ) : (
                    <ul className="divide-border divide-y">
                        {logs.map((l) => (
                            <li key={l.id} className="flex items-start justify-between gap-4 py-2.5">
                                <div>
                                    <p className="text-sm">{l.description}</p>
                                    <p className="text-muted-foreground text-xs">
                                        {l.user}
                                        {l.ip_address ? ` · ${l.ip_address}` : ''}
                                    </p>
                                </div>
                                <span className="text-muted-foreground shrink-0 text-xs whitespace-nowrap">{formatDateTime(l.created_at)}</span>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            <Dialog open={userOpen} onOpenChange={setUserOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editing ? 'Kelola Akun' : 'Tambah Akun'}</DialogTitle>
                        <DialogDescription>
                            {editing ? 'Perbarui data, peran, status, atau reset kata sandi.' : 'Buat akun kasir atau pemilik baru.'}
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={saveUser} className="space-y-4">
                        <div>
                            <Label htmlFor="u_name">Nama</Label>
                            <Input id="u_name" value={userForm.data.name} onChange={(e) => userForm.setData('name', e.target.value)} />
                            {userForm.errors.name && <p className="text-destructive mt-1 text-xs">{userForm.errors.name}</p>}
                        </div>
                        <div>
                            <Label htmlFor="u_email">Email</Label>
                            <Input
                                id="u_email"
                                type="email"
                                value={userForm.data.email}
                                onChange={(e) => userForm.setData('email', e.target.value)}
                            />
                            {userForm.errors.email && <p className="text-destructive mt-1 text-xs">{userForm.errors.email}</p>}
                        </div>
                        <div>
                            <Label htmlFor="u_password">{editing ? 'Kata Sandi Baru (opsional)' : 'Kata Sandi'}</Label>
                            <Input
                                id="u_password"
                                type="password"
                                value={userForm.data.password}
                                onChange={(e) => userForm.setData('password', e.target.value)}
                                placeholder={editing ? 'Kosongkan bila tidak diubah' : ''}
                            />
                            {userForm.errors.password && <p className="text-destructive mt-1 text-xs">{userForm.errors.password}</p>}
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>Peran</Label>
                                <Select value={userForm.data.role} onValueChange={(v) => userForm.setData('role', v as Role)}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="kasir">Kasir</SelectItem>
                                        <SelectItem value="pemilik">Pemilik</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <label className="flex items-end gap-2 pb-2 text-sm">
                                <input
                                    type="checkbox"
                                    checked={userForm.data.is_active}
                                    onChange={(e) => userForm.setData('is_active', e.target.checked)}
                                    className="border-input h-4 w-4 rounded"
                                />
                                Akun aktif
                            </label>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setUserOpen(false)} disabled={userForm.processing}>
                                Batal
                            </Button>
                            <Button type="submit" disabled={userForm.processing}>
                                Simpan
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </PosLayout>
    );
}
