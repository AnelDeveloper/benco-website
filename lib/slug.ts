/** Bosnian letters that have no ASCII equivalent in NFD normalization. */
const FOLD: Record<string, string> = { đ: 'd', Đ: 'D' };

/**
 * URL-safe slug from a title.
 *
 * Diacritics are folded rather than dropped, so "Vila sa jezerom" and
 * "Čardak" both produce readable slugs instead of losing characters.
 */
export function slugify(text: string): string {
  return text
    .replace(/[đĐ]/g, (char) => FOLD[char])
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
