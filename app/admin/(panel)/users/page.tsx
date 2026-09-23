import { requireUserAdmin, type Role } from '@/lib/auth/admin';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireEnv } from '@/lib/env';
import { UserList, type ListedUser } from '@/components/admin/UserList';

export const dynamic = 'force-dynamic';

/** Which emails actually have a login, so the list can flag rows that cannot sign in. */
async function emailsWithLogin(): Promise<Set<string>> {
  try {
    const response = await fetch(`${requireEnv('NEXT_PUBLIC_SUPABASE_URL')}/auth/v1/admin/users`, {
      headers: {
        apikey: requireEnv('SUPABASE_SERVICE_ROLE_KEY'),
        Authorization: `Bearer ${requireEnv('SUPABASE_SERVICE_ROLE_KEY')}`,
      },
      cache: 'no-store',
    });
    const body = await response.json();
    return new Set<string>(
      (body?.users ?? []).map((u: { email?: string }) => (u.email ?? '').toLowerCase()),
    );
  } catch {
    return new Set();
  }
}

export default async function UsersPage() {
  const admin = await requireUserAdmin();
  const db = createAdminClient();

  const [{ data }, logins] = await Promise.all([
    db.from('app_users').select('*').order('role').order('email'),
    emailsWithLogin(),
  ]);

  const users: ListedUser[] = (data ?? []).map((row) => ({
    email: row.email,
    role: row.role as Role,
    name: row.name,
    created_at: row.created_at,
    canSignIn: logins.has(row.email.toLowerCase()),
  }));

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-bold text-slate-900">Korisnici</h1>
      <p className="mb-6 mt-1 text-slate-600">Dodajte kolege i odredite šta mogu raditi.</p>
      <UserList users={users} currentEmail={admin.email} />
    </div>
  );
}
