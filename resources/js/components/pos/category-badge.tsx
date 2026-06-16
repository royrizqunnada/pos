interface CategoryBadgeProps {
    name: string;
    color?: string | null;
}

/** Colored tag for a product category. */
export function CategoryBadge({ name, color }: CategoryBadgeProps) {
    const c = color ?? '#6E665A';
    return (
        <span
            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium"
            style={{ backgroundColor: `${c}1A`, color: c }}
        >
            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: c }} />
            {name}
        </span>
    );
}
