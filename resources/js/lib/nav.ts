import { type NavItem } from '@/types';
import { BarChart3, Boxes, LayoutDashboard, Settings, ShoppingCart, Store, Truck, Users } from 'lucide-react';

/** Primary sidebar navigation for the POS. `can` gates owner-only items. */
export const mainNav: NavItem[] = [
    { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
    { title: 'Kasir', url: '/kasir', icon: ShoppingCart },
    { title: 'Barang', url: '/barang', icon: Boxes },
    { title: 'Pelanggan', url: '/pelanggan', icon: Users },
    { title: 'Pembelian', url: '/pembelian', icon: Truck, can: 'manage_purchases' },
    { title: 'Pemasok', url: '/pemasok', icon: Store, can: 'manage_master' },
    { title: 'Laporan', url: '/laporan', icon: BarChart3 },
    { title: 'Pengaturan', url: '/pengaturan', icon: Settings, can: 'manage_settings' },
];
