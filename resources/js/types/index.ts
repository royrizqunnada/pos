import { LucideIcon } from 'lucide-react';

export type Role = 'pemilik' | 'kasir';

export interface Permissions {
    manage_master: boolean;
    manage_users: boolean;
    manage_settings: boolean;
    manage_purchases: boolean;
    view_profit: boolean;
    view_cost_price: boolean;
}

export interface Auth {
    user: User;
    permissions: Permissions;
}

export interface BreadcrumbItem {
    title: string;
    href: string;
}

export interface NavGroup {
    title: string;
    items: NavItem[];
}

export interface NavItem {
    title: string;
    url: string;
    icon?: LucideIcon | null;
    isActive?: boolean;
    /** Permission key required to see this item; omit for everyone. */
    can?: keyof Permissions;
}

export interface SharedData {
    name: string;
    auth: Auth;
    settings: { store_name: string };
    flash: { success: string | null; error: string | null };
    [key: string]: unknown;
}

export interface User {
    id: number;
    name: string;
    email: string;
    role: Role;
    is_active: boolean;
    avatar?: string;
    email_verified_at: string | null;
    created_at: string;
    updated_at: string;
    [key: string]: unknown;
}

/** Standard Laravel paginator shape used across index pages. */
export interface Paginated<T> {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
    links: { url: string | null; label: string; active: boolean }[];
}

export interface Category {
    id: number;
    name: string;
    color: string;
}

export interface Unit {
    id: number;
    name: string;
}

export interface Product {
    id: number;
    sku: string | null;
    barcode: string | null;
    name: string;
    category: Category | null;
    unit: Unit | null;
    category_id: number;
    unit_id: number;
    sell_price: number;
    wholesale_price: number | null;
    wholesale_min_qty: number | null;
    stock: number;
    min_stock: number;
    is_active: boolean;
    is_low_stock: boolean;
    /** Null for cashiers (cost price hidden). */
    cost_price: number | null;
}
