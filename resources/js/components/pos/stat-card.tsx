import { cn } from '@/lib/utils';
import { type LucideIcon } from 'lucide-react';

interface StatCardProps {
    label: string;
    value: string;
    icon?: LucideIcon;
    /** Accent tint for the icon chip. */
    tone?: 'default' | 'success' | 'danger' | 'amber';
    hint?: string;
}

const tones: Record<NonNullable<StatCardProps['tone']>, string> = {
    default: 'bg-accent text-foreground',
    success: 'bg-success/10 text-success',
    danger: 'bg-destructive/10 text-destructive',
    amber: 'bg-primary/10 text-primary',
};

export function StatCard({ label, value, icon: Icon, tone = 'default', hint }: StatCardProps) {
    return (
        <div className="border-border bg-card rounded-xl border p-5">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="text-muted-foreground text-sm">{label}</p>
                    <p className="font-display text-foreground tabular mt-1 text-2xl font-semibold">{value}</p>
                    {hint && <p className="text-muted-foreground mt-1 text-xs">{hint}</p>}
                </div>
                {Icon && (
                    <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-lg', tones[tone])}>
                        <Icon className="h-5 w-5" />
                    </span>
                )}
            </div>
        </div>
    );
}
