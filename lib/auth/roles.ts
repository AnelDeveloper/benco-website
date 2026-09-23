/**
 * Role definitions — deliberately free of server imports.
 *
 * Client components (the navigation, the user list) need to know what a role
 * can reach. Keeping these here means importing them does not drag in the
 * service-role Supabase client, which is marked `server-only` and would fail
 * the build the moment a client component touched it.
 */
export type Role = 'user' | 'support' | 'admin';

export const ROLE_LABEL: Record<Role, string> = {
  user: 'Bez pristupa',
  support: 'Podrška',
  admin: 'Administrator',
};

/** What each role may reach. Support answers customers; admins run the place. */
export const CAN: Record<Role, { content: boolean; customers: boolean; users: boolean }> = {
  user: { content: false, customers: false, users: false },
  support: { content: false, customers: true, users: false },
  admin: { content: true, customers: true, users: true },
};
