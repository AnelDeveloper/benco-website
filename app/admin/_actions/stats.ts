'use server';

import { revalidatePath } from 'next/cache';
import { requireContentAdmin } from '@/lib/auth/admin';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * `values` carries what was just saved back to the form.
 *
 * Revalidating is not enough on its own: React applies `defaultValue` only when
 * an input mounts and ignores it changing afterwards, so a form re-rendered
 * with fresh server props still shows the values it was built with. The form
 * re-seeds from here instead.
 */
export type StatsState = {
  message: string | null;
  error: boolean;
  values: Record<string, string> | null;
};

const FIELDS = [
  'projects_completed',
  'sqm_delivered',
  'investors_count',
  'years_experience',
] as const;

export async function updateStats(_prev: StatsState, formData: FormData): Promise<StatsState> {
  await requireContentAdmin();

  const values: Record<string, number> = {};
  for (const field of FIELDS) {
    const raw = Number(formData.get(field) ?? 0);
    if (!Number.isFinite(raw) || raw < 0) {
      return {
        message: 'Sve vrijednosti moraju biti brojevi 0 ili veći.',
        error: true,
        values: Object.fromEntries(
          FIELDS.map((f) => [f, String(formData.get(f) ?? '')]),
        ),
      };
    }
    values[field] = Math.round(raw);
  }

  const db = createAdminClient();
  const { error } = await db.from('site_stats').upsert({ id: true, ...values });

  if (error) {
    return {
      message: `Greška: ${error.message}`,
      error: true,
      values: Object.fromEntries(FIELDS.map((f) => [f, String(formData.get(f) ?? '')])),
    };
  }

  // The public site AND this page: without the second call the form
  // re-renders from stale server data and snaps back to the old numbers,
  // which reads as "it didn't save" even though it did.
  revalidatePath('/', 'layout');
  revalidatePath('/admin/stats');
  return {
    message: 'Sačuvano.',
    error: false,
    values: Object.fromEntries(FIELDS.map((f) => [f, String(values[f])])),
  };
}
