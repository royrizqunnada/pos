import { type LucideIcon } from 'lucide-react';
import { type ReactNode } from 'react';

interface EmptyStateProps {
    icon?: LucideIcon;
    title: string;
    description?: string;
    action?: ReactNode;
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
    return (
        <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
            {Icon && (
                <span className="bg-accent text-muted-foreground flex h-12 w-12 items-center justify-center rounded-full">
                    <Icon className="h-6 w-6" />
                </span>
            )}
            <div>
                <p className="font-display text-foreground text-base font-semibold">{title}</p>
                {description && <p className="text-muted-foreground mt-1 text-sm">{description}</p>}
            </div>
            {action}
        </div>
    );
}
