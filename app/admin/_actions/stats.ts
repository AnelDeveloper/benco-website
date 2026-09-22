'use server';

import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth/admin';
import { createAdminClient } from '@/lib/supabase/admin';

export type StatsState = { message: string | null; error: boolean };

const FIELDS = [
  'projects_completed',
  'sqm_delivered',
  'investors_count',
  'years_experience',
] as const;

export async function updateStats(_prev: StatsState, formData: FormData): Promise<StatsState> {
  await requireAdmin();

  const values: Record<string, number> = {};
  for (const field of FIELDS) {
    const raw = Number(formData.get(field) ?? 0);
    if (!Number.isFinite(raw) || raw < 0) {
      return { message: 'Sve vrijednosti moraju biti brojevi 0 ili veći.', error: true };
    }
    values[field] = Math.round(raw);
  }

  const db = createAdminClient();
  const { error } = await db.from('site_stats').upsert({ id: true, ...values });

  if (error) return { message: `Greška: ${error.message}`, error: true };

  revalidatePath('/', 'layout');
  return { message: 'Sačuvano.', error: false };
}
