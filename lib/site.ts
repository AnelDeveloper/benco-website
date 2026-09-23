/**
 * The site's public origin, from NEXT_PUBLIC_SITE_URL.
 *
 * Used for canonical links, Open Graph URLs, the sitemap and robots.txt. Keep
 * it in one place: a stale domain here silently breaks link previews and
 * search indexing without breaking any page, so it is easy to miss.
 */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000').replace(/\/+$/, '');
