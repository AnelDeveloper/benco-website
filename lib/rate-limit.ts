/**
 * Abuse guards for public submissions.
 *
 * Bookings lock dates the moment they are submitted, so an unthrottled form
 * would let one person block a whole season. Counts come from the database
 * rather than memory, because serverless instances do not share memory.
 */
export const MAX_PER_EMAIL = 5;
export const MAX_PER_IP = 15;
export const WINDOW_MINUTES = 60;

export function isOverLimit(counts: { byEmail: number; byIp: number }): boolean {
  return counts.byEmail >= MAX_PER_EMAIL || counts.byIp >= MAX_PER_IP;
}

/** Best-effort client IP from proxy headers. Vercel sets x-forwarded-for. */
export function clientIp(headers: Headers): string | null {
  const forwarded = headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim() || null;
  return headers.get('x-real-ip');
}
