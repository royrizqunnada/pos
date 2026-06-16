import { cn } from '@/lib/utils';
import { type Paginated } from '@/types';
import { Link } from '@inertiajs/react';

/** Renders Laravel paginator links; hidden when there is only one page. */
export function Pagination<T>({ paginator }: { paginator: Paginated<T> }) {
    if (paginator.last_page <= 1) return null;

    return (
        <div className="border-border flex flex-wrap items-center justify-between gap-3 border-t px-4 py-3">
            <p className="text-muted-foreground text-sm">
                Menampilkan {paginator.from ?? 0}–{paginator.to ?? 0} dari {paginator.total}
            </p>
            <div className="flex flex-wrap gap-1">
                {paginator.links.map((link, i) => (
                    <Link
                        key={i}
                        href={link.url ?? '#'}
                        preserveScroll
                        preserveState
                        className={cn(
                            'min-w-9 rounded-md border px-3 py-1.5 text-center text-sm',
                            link.active
                                ? 'border-primary bg-primary text-primary-foreground'
                                : 'border-border bg-card text-foreground hover:bg-accent',
                            !link.url && 'pointer-events-none opacity-40',
                        )}
                        dangerouslySetInnerHTML={{ __html: link.label }}
                    />
                ))}
            </div>
        </div>
    );
}
