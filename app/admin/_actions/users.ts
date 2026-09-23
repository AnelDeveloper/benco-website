'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { requireUserAdmin } from '@/lib/auth/admin';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireEnv } from '@/lib/env';
import type { AppRole } from '@/lib/supabase/types';

export type UserFormState = { error: string | null; message: string | null };

const ROLES: AppRole[] = ['user', 'support', 'admin'];

const newUserSchema = z.object({
  email: z.string().trim().max(200).email('Unesite ispravnu email adresu')
    .transform((v) => v.toLowerCase()),
  name: z.string().trim().max(120).optional(),
  role: z.enum(['user', 'support', 'admin']),
  password: z.string().min(10, 'Lozinka mora imati najmanje 10 znakova').max(200),
});

/**
 * Creates the Supabase Auth account and the role row together.
 *
 * Signups are disabled on the project, so an account can only come from here —
 * which is what keeps strangers out of the panel.
 */
export async function createUser(
  _prev: UserFormState,
  formData: FormData,
): Promise<UserFormState> {
  const admin = await requireUserAdmin();

  const parsed = newUserSchema.safeParse({
    email: formData.get('email'),
    name: formData.get('name') || undefined,
    role: formData.get('role'),
    password: formData.get('password'),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Neispravni podaci.', message: null };
  }

  const { email, name, role, password } = parsed.data;
  const db = createAdminClient();

  const { data: existing } = await db.from('app_users').select('email').ilike('email', email).maybeSingle();
  if (existing) return { error: 'Taj korisnik već postoji.', message: null };

  const response = await fetch(`${requireEnv('NEXT_PUBLIC_SUPABASE_URL')}/auth/v1/admin/users`, {
    method: 'POST',
    headers: {
      apikey: requireEnv('SUPABASE_SERVICE_ROLE_KEY'),
      Authorization: `Bearer ${requireEnv('SUPABASE_SERVICE_ROLE_KEY')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password, email_confirm: true }),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    const already = String(body?.msg ?? body?.message ?? '').toLowerCase().includes('already');
    if (!already) {
      return { error: `Greška pri kreiranju naloga: ${body?.msg ?? response.status}`, message: null };
    }
  }

  const { error } = await db
    .from('app_users')
    .insert({ email, role, name: name ?? null, created_by: admin.email });

  if (error) return { error: `Greška pri spremanju: ${error.message}`, message: null };

  revalidatePath('/admin/users');
  return { error: null, message: `Korisnik ${email} je dodan.` };
}

export async function setUserRole(email: string, role: AppRole) {
  const admin = await requireUserAdmin();
  if (!ROLES.includes(role)) return;

  // Without this an admin could demote themselves and lock the last admin out.
  if (email.toLowerCase() === admin.email.toLowerCase()) return;

  const db = createAdminClient();
  await db.from('app_users').update({ role }).ilike('email', email);
  revalidatePath('/admin/users');
}

export async function deleteUser(email: string) {
  const admin = await requireUserAdmin();
  if (email.toLowerCase() === admin.email.toLowerCase()) return;

  const db = createAdminClient();

  // Remove the login as well as the role row, or the account lingers able to
  // authenticate with no permissions.
  const list = await fetch(`${requireEnv('NEXT_PUBLIC_SUPABASE_URL')}/auth/v1/admin/users`, {
    headers: {
      apikey: requireEnv('SUPABASE_SERVICE_ROLE_KEY'),
      Authorization: `Bearer ${requireEnv('SUPABASE_SERVICE_ROLE_KEY')}`,
    },
  }).then((r) => r.json()).catch(() => null);

  const match = list?.users?.find(
    (u: { id: string; email: string }) => u.email?.toLowerCase() === email.toLowerCase(),
  );

  if (match?.id) {
    await fetch(`${requireEnv('NEXT_PUBLIC_SUPABASE_URL')}/auth/v1/admin/users/${match.id}`, {
      method: 'DELETE',
      headers: {
        apikey: requireEnv('SUPABASE_SERVICE_ROLE_KEY'),
        Authorization: `Bearer ${requireEnv('SUPABASE_SERVICE_ROLE_KEY')}`,
      },
    });
  }

  await db.from('app_users').delete().ilike('email', email);
  revalidatePath('/admin/users');
}
