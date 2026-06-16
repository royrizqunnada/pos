import { mainNav } from '@/lib/nav';
import { cn } from '@/lib/utils';
import { type SharedData } from '@/types';
import { Link, router, usePage } from '@inertiajs/react';
import { LogOut } from 'lucide-react';

function isActive(currentUrl: string, itemUrl: string): boolean {
    if (itemUrl === '/dashboard') {
        return currentUrl === '/dashboard' || currentUrl === '/';
    }
    return currentUrl === itemUrl || currentUrl.startsWith(itemUrl + '/');
}

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
    const page = usePage<SharedData>();
    const { auth, settings, lowStockCount } = page.props;
    const permissions = auth.permissions;
    const url = page.url.split('?')[0];

    const items = mainNav.filter((item) => !item.can || permissions[item.can]);

    return (
        <div className="bg-sidebar text-sidebar-foreground flex h-full flex-col">
            {/* Brand */}
            <div className="border-sidebar-border flex items-center gap-3 border-b px-5 py-5">
                <div className="bg-primary font-display text-primary-foreground flex h-10 w-10 items-center justify-center rounded-md text-lg font-bold">
                    BJ
                </div>
                <div className="leading-tight">
                    <div className="font-display text-base font-semibold text-white">{settings.store_name}</div>
                    <div className="text-sidebar-foreground/70 text-xs">Point of Sale</div>
                </div>
            </div>

            {/* Nav */}
            <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
                {items.map((item) => {
                    const active = isActive(url, item.url);
                    const Icon = item.icon;
                    return (
                        <Link
                            key={item.url}
                            href={item.url}
                            onClick={onNavigate}
                            className={cn(
                                'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors',
                                active
                                    ? 'bg-primary text-primary-foreground shadow-sm'
                                    : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                            )}
                        >
                            {Icon && <Icon className="h-5 w-5 shrink-0" />}
                            <span>{item.title}</span>
                            {item.url === '/barang' && lowStockCount > 0 && (
                                <span
                                    className={cn(
                                        'ml-auto flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-semibold',
                                        active ? 'bg-white/25 text-white' : 'bg-destructive text-destructive-foreground',
                                    )}
                                >
                                    {lowStockCount}
                                </span>
                            )}
                        </Link>
                    );
                })}
            </nav>

            {/* User footer */}
            <div className="border-sidebar-border border-t px-3 py-3">
                <div className="flex items-center gap-3 rounded-md px-2 py-2">
                    <div className="bg-sidebar-accent font-display flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold text-white">
                        {auth.user.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1 leading-tight">
                        <div className="truncate text-sm font-medium text-white">{auth.user.name}</div>
                        <div className="text-sidebar-foreground/70 text-xs capitalize">{auth.user.role}</div>
                    </div>
                    <button
                        type="button"
                        title="Keluar"
                        onClick={() => router.post('/logout')}
                        className="text-sidebar-foreground/70 hover:bg-sidebar-accent rounded-md p-2 transition-colors hover:text-white"
                    >
                        <LogOut className="h-4 w-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}
