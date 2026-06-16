import { type SharedData } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { Store } from 'lucide-react';

interface AuthLayoutProps {
    children: React.ReactNode;
    name?: string;
    title?: string;
    description?: string;
}

export default function AuthSimpleLayout({ children, title, description }: AuthLayoutProps) {
    const { settings } = usePage<SharedData>().props;

    return (
        <div className="bg-background relative flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
            {/* Safety hazard stripe accent (echoes the brand cover) */}
            <div
                className="absolute inset-x-0 top-0 h-1.5"
                style={{ backgroundImage: 'repeating-linear-gradient(45deg, #E15A12 0 12px, #262F33 12px 24px)' }}
            />

            <div className="w-full max-w-sm">
                <div className="flex flex-col gap-8">
                    <div className="flex flex-col items-center gap-4">
                        <Link href={route('home')} className="flex flex-col items-center gap-3">
                            <div className="bg-primary text-primary-foreground flex h-12 w-12 items-center justify-center rounded-xl shadow-sm">
                                <Store className="h-6 w-6" />
                            </div>
                            <div className="text-center leading-tight">
                                <div className="font-display text-foreground text-lg font-bold">{settings.store_name}</div>
                                <div className="text-muted-foreground text-xs">Toko Bangunan &amp; Material</div>
                            </div>
                        </Link>

                        <div className="space-y-1.5 text-center">
                            <h1 className="font-display text-foreground text-xl font-semibold">{title}</h1>
                            <p className="text-muted-foreground text-center text-sm">{description}</p>
                        </div>
                    </div>

                    <div className="border-border bg-card rounded-xl border p-6 shadow-sm">{children}</div>
                </div>
            </div>
        </div>
    );
}
