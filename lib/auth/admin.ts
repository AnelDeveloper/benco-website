import { redirect } from 'next/navigation';
import { CAN, ROLE_LABEL, type Role } from './roles';

// Re-exported so server code has one import for everything auth-related.
export { CAN, ROLE_LABEL };
export type { Role };

/**
 * Is this email authorized at all?
 *
 * ADMIN_EMAILS is a bootstrap safety net, not the permission model — roles live
 * in the database. It exists so a missing or mistyped row cannot lock everyone
 * out of the panel. Compared whole after splitting on commas, so `evil-a@b.com`
 * never matches `a@b.com`.
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

export type AdminUser = { id: string; email: string; role: Role };

/**
 * The signed-in user and their role, or null when not signed in.
 *
 * Uses getUser() rather than getSession(): getSession reads the cookie without
 * contacting Supabase, so a forged or stale cookie would pass.
 */
export async function getAdminUser(): Promise<AdminUser | null> {
  const { createServerSupabase } = await import('@/lib/supabase/server');
  const supabase = await createServerSupabase();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user?.email) return null;

  const email = data.user.email;
  const { createAdminClient } = await import('@/lib/supabase/admin');
  const db = createAdminClient();

  const { data: row } = await db
    .from('app_users')
    .select('role')
    .ilike('email', email)
    .maybeSingle();

  // Bootstrap: an address in ADMIN_EMAILS is an admin even without a row, so a
  // missing record cannot lock the owner out of their own panel.
  const bootstrap = isAdminEmail(email, process.env.ADMIN_EMAILS);
  const role = (row?.role as Role | undefined) ?? (bootstrap ? 'admin' : null);

  if (!role) return null;
  return { id: data.user.id, email, role: bootstrap && role !== 'admin' ? 'admin' : role };
}

/** Signed in with any role. Sends everyone else to the login page. */
export async function requireAdmin(): Promise<AdminUser> {
  const user = await getAdminUser();
  if (!user) redirect('/admin/login');
  return user;
}

/** Enquiries and bookings: support and admin. */
export async function requireStaff(): Promise<AdminUser> {
  const user = await requireAdmin();
  if (!CAN[user.role].customers) redirect('/admin');
  return user;
}

/** Properties, projects, tours, statistics: admin only. */
export async function requireContentAdmin(): Promise<AdminUser> {
  const user = await requireAdmin();
  if (!CAN[user.role].content) redirect('/admin');
  return user;
}

/** Managing other users: admin only. */
export async function requireUserAdmin(): Promise<AdminUser> {
  const user = await requireAdmin();
  if (!CAN[user.role].users) redirect('/admin');
  return user;
}
