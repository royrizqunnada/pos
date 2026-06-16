import { type SharedData } from '@/types';
import { usePage } from '@inertiajs/react';
import { CheckCircle2, X, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';

/** Lightweight flash message toast driven by the shared `flash` prop. */
export function Flash() {
    const { flash } = usePage<SharedData>().props;
    const [visible, setVisible] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    useEffect(() => {
        if (flash.success) {
            setVisible({ type: 'success', message: flash.success });
        } else if (flash.error) {
            setVisible({ type: 'error', message: flash.error });
        }
    }, [flash.success, flash.error]);

    useEffect(() => {
        if (!visible) return;
        const t = setTimeout(() => setVisible(null), 4000);
        return () => clearTimeout(t);
    }, [visible]);

    if (!visible) return null;

    const isSuccess = visible.type === 'success';

    return (
        <div className="no-print bg-card fixed top-4 right-4 z-[100] flex max-w-sm items-start gap-3 rounded-lg border px-4 py-3 shadow-lg">
            {isSuccess ? (
                <CheckCircle2 className="text-success mt-0.5 h-5 w-5 shrink-0" />
            ) : (
                <XCircle className="text-destructive mt-0.5 h-5 w-5 shrink-0" />
            )}
            <p className="text-card-foreground text-sm">{visible.message}</p>
            <button type="button" onClick={() => setVisible(null)} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
            </button>
        </div>
    );
}
