export type Locale = 'bs' | 'en';

function asText(value: unknown): string | null {
  return typeof value === 'string' && value.trim() !== '' ? value : null;
}

/**
 * Reads a bilingual column pair, e.g. localized(row, 'title', 'en') reads
 * `title_en` and falls back to `title_bs`. Bosnian is the source language, so
 * a listing with no English translation still renders on the English site.
 */
export function localized(
  row: Record<string, unknown>,
  field: string,
  locale: Locale,
): string {
  return asText(row[`${field}_${locale}`]) ?? asText(row[`${field}_bs`]) ?? '';
}
