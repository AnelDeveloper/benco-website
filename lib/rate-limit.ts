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

/**
 * Client IP from proxy headers.
 *
 * The FIRST entry of `x-forwarded-for` is attacker-controlled: a client may send
 * its own header and the proxy appends to it rather than replacing it, so
 * trusting the first entry lets anyone rotate a fake IP per request and bypass
 * the limit entirely. Prefer headers the edge sets itself, and otherwise read
 * the LAST entry, which is the hop closest to us.
 */
export function clientIp(headers: Headers): string | null {
  const vercel = headers.get('x-vercel-forwarded-for');
  if (vercel) return vercel.split(',').pop()?.trim() || null;

  const real = headers.get('x-real-ip');
  if (real?.trim()) return real.trim();

  const forwarded = headers.get('x-forwarded-for');
  if (forwarded) {
    const hops = forwarded.split(',').map((hop) => hop.trim()).filter(Boolean);
    return hops.length > 0 ? hops[hops.length - 1] : null;
  }

  return null;
}
