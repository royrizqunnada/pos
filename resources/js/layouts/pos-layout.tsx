import { Flash } from '@/components/pos/flash';
import { SidebarNav } from '@/components/pos/sidebar-nav';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { Menu } from 'lucide-react';
import { type ReactNode, useState } from 'react';

interface PosLayoutProps {
    children: ReactNode;
    title: string;
    /** Optional action node rendered on the right of the page header. */
    actions?: ReactNode;
    breadcrumbs?: BreadcrumbItem[];
}

export default function PosLayout({ children, title, actions }: PosLayoutProps) {
    const [mobileOpen, setMobileOpen] = useState(false);

    return (
        <div className="bg-background flex min-h-screen">
            <Head title={title} />

            {/* Permanent steel sidebar on desktop / tablet landscape */}
            <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 lg:block">
                <SidebarNav />
            </aside>

            {/* Mobile sidebar */}
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                <SheetContent side="left" className="bg-sidebar w-64 border-0 p-0">
                    <SheetTitle className="sr-only">Menu navigasi</SheetTitle>
                    <SidebarNav onNavigate={() => setMobileOpen(false)} />
                </SheetContent>
            </Sheet>

            {/* Content */}
            <div className="flex min-h-screen flex-1 flex-col lg:pl-64">
                <header className="no-print border-border bg-card/80 sticky top-0 z-20 flex min-h-16 items-center gap-3 border-b px-4 py-2.5 backdrop-blur-sm sm:px-6">
                    <button
                        type="button"
                        onClick={() => setMobileOpen(true)}
                        className="text-muted-foreground hover:bg-accent hover:text-foreground -ml-1 shrink-0 rounded-md p-2 lg:hidden"
                        aria-label="Buka menu"
                    >
                        <Menu className="h-5 w-5" />
                    </button>
                    <h1 className="font-display text-foreground min-w-0 flex-1 truncate text-base font-semibold sm:text-xl">{title}</h1>
                    {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
                </header>

                <main className="flex-1 p-4 sm:p-6">{children}</main>
            </div>

            <Flash />
        </div>
    );
}
