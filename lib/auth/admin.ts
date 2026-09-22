import { redirect } from 'next/navigation';

/**
 * Is this email authorized to use the admin panel?
 *
 * Pure and separately tested because it is the gate on every admin page and
 * every server action. Substring matches are deliberately impossible: the list
 * is split on commas and compared whole, so `evil-a@b.com` never matches
 * `a@b.com`.
 */
export function isAdminEmail(
  email: string | null | undefined,
  adminEmailsEnv: string | null | undefined,
): boolean {
  if (!email || !adminEmailsEnv) return false;

  const allowed = adminEmailsEnv
    .split(',')
    .map((entry) => entry.trim().toLowerCase())
    .filter((entry) => entry !== '');

  return allowed.includes(email.trim().toLowerCase());
}

export type AdminUser = { id: string; email: string };

/**
 * The signed-in admin, or null.
 *
 * Uses getUser() rather than getSession(): getSession reads the cookie without
 * contacting Supabase, so a forged or stale cookie would pass. getUser verifies
 * the token server-side.
 */
export async function getAdminUser(): Promise<AdminUser | null> {
  const { createServerSupabase } = await import('@/lib/supabase/server');
  const supabase = await createServerSupabase();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user?.email) return null;
  if (!isAdminEmail(data.user.email, process.env.ADMIN_EMAILS)) return null;

  return { id: data.user.id, email: data.user.email };
}

/** Same, but sends unauthorized visitors to the login page. */
export async function requireAdmin(): Promise<AdminUser> {
  const user = await getAdminUser();
  if (!user) redirect('/admin/login');
  return user;
}
