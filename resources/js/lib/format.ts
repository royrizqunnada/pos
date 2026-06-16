/**
 * Format an integer amount of Rupiah (no decimals) as `Rp65.000`.
 * Money throughout the app is stored as whole-rupiah integers.
 */
export function formatRupiah(value: number | string | null | undefined): string {
    const n = typeof value === 'string' ? parseFloat(value) : (value ?? 0);
    const safe = Number.isFinite(n) ? Math.round(n) : 0;
    return 'Rp' + new Intl.NumberFormat('id-ID').format(safe);
}

/**
 * Format a quantity that may be fractional (e.g. 1.5 m³, 0.5 kg).
 * Trailing zeros are trimmed so whole numbers show cleanly.
 */
export function formatQty(value: number | string | null | undefined): string {
    const n = typeof value === 'string' ? parseFloat(value) : (value ?? 0);
    const safe = Number.isFinite(n) ? n : 0;
    return new Intl.NumberFormat('id-ID', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    }).format(safe);
}

/** Format a date as `16 Jun 2026`. */
export function formatDate(value: string | Date | null | undefined): string {
    if (!value) return '-';
    const d = typeof value === 'string' ? new Date(value) : value;
    if (Number.isNaN(d.getTime())) return '-';
    return new Intl.DateTimeFormat('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    }).format(d);
}

/** Format a date and time as `16 Jun 2026, 14.05`. */
export function formatDateTime(value: string | Date | null | undefined): string {
    if (!value) return '-';
    const d = typeof value === 'string' ? new Date(value) : value;
    if (Number.isNaN(d.getTime())) return '-';
    return new Intl.DateTimeFormat('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(d);
}
