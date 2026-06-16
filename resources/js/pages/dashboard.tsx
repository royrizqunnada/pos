import PosLayout from '@/layouts/pos-layout';
import { type SharedData } from '@/types';
import { usePage } from '@inertiajs/react';

export default function Dashboard() {
    const { auth, settings } = usePage<SharedData>().props;

    return (
        <PosLayout title="Dashboard">
            <div className="border-border bg-card rounded-xl border p-8">
                <h2 className="font-display text-foreground text-2xl font-semibold">Selamat datang, {auth.user.name}.</h2>
                <p className="text-muted-foreground mt-2">Sistem Point of Sale {settings.store_name}. Ringkasan dan laporan akan tampil di sini.</p>
            </div>
        </PosLayout>
    );
}
