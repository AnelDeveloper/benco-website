'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';
import { createServerSupabase } from '@/lib/supabase/server';
import { isAdminEmail } from '@/lib/auth/admin';

const credentials = z.object({
  email: z.string().email('Unesite ispravnu email adresu'),
  password: z.string().min(1, 'Unesite lozinku'),
});

export type SignInState = { error: string | null };

/**
 * Two gates, one message.
 *
 * Authenticating is not enough — the email must also be authorized. Both
 * failures return the same text on purpose: telling a stranger "correct
 * password, wrong account" confirms which credentials are real.
 */
export async function signIn(
  _prev: SignInState,
  formData: FormData,
): Promise<SignInState> {
  const parsed = credentials.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const supabase = await createServerSupabase();
  const { data, error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error || !data.user?.email) {
    return { error: 'Pogrešan email ili lozinka.' };
  }

  if (!isAdminEmail(data.user.email, process.env.ADMIN_EMAILS)) {
    await supabase.auth.signOut();
    return { error: 'Pogrešan email ili lozinka.' };
  }

  redirect('/admin');
}

export async function signOut() {
  const supabase = await createServerSupabase();
  await supabase.auth.signOut();
  redirect('/admin/login');
}
