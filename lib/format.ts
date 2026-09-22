/**
 * Deterministic date formatting.
 *
 * `toLocaleDateString('bs-BA')` is not safe in a client component: Node and the
 * browser ship different ICU data, so the server renders `2026-09-22` while
 * Chrome renders `22. 9. 2026.` and React reports a hydration mismatch. These
 * helpers produce the same string everywhere.
 */
export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return '';
  const date = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return '';

  const day = String(date.getUTCDate()).padStart(2, '0');
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  return `${day}.${month}.${date.getUTCFullYear()}`;
}

/** Thousands separated with a dot, the Bosnian convention. */
export function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '';
  const [whole, fraction] = String(value).split('.');
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return fraction ? `${grouped},${fraction}` : grouped;
}
