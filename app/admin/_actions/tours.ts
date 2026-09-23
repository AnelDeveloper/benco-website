'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/auth/admin';
import { createAdminClient } from '@/lib/supabase/admin';
import { parseTourForm } from '@/lib/validation/property';
import { slugify } from '@/lib/slug';
import type { FormState } from './properties';

export type { FormState };

function submittedValues(formData: FormData): Record<string, string> {
  const values: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    if (typeof value === 'string') values[key] = value;
  }
  return values;
}

function revalidatePublic(id?: string) {
  revalidatePath('/', 'layout');
  revalidatePath('/admin/tours');
  if (id) revalidatePath(`/admin/tours/${id}`);
}

async function uniqueSlug(base: string, excludeId?: string): Promise<string> {
  const db = createAdminClient();
  const root = base || 'tura';

  for (let suffix = 0; suffix < 50; suffix += 1) {
    const candidate = suffix === 0 ? root : `${root}-${suffix + 1}`;
    const { data } = await db.from('tours').select('id').eq('slug', candidate).maybeSingle();
    if (!data || data.id === excludeId) return candidate;
  }
  return `${root}-${Date.now()}`;
}

export async function createTour(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();

  const parsed = parseTourForm(formData);
  if (!parsed.ok) {
    return { errors: parsed.errors, message: 'Provjerite označena polja.', values: submittedValues(formData) };
  }

  const db = createAdminClient();
  const slug = await uniqueSlug(slugify(parsed.data.title_bs));

  const { data, error } = await db.from('tours').insert({ ...parsed.data, slug }).select('id').single();

  if (error || !data) {
    return {
      errors: {},
      message: `Greška pri spremanju: ${error?.message ?? 'nepoznato'}`,
      values: submittedValues(formData),
    };
  }

  revalidatePublic();
  redirect(`/admin/tours/${data.id}`);
}

export async function updateTour(id: string, _prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();

  const parsed = parseTourForm(formData);
  if (!parsed.ok) {
    return { errors: parsed.errors, message: 'Provjerite označena polja.', values: submittedValues(formData) };
  }

  const db = createAdminClient();
  const { error } = await db.from('tours').update(parsed.data).eq('id', id);

  if (error) {
    return { errors: {}, message: `Greška pri spremanju: ${error.message}`, values: submittedValues(formData) };
  }

  revalidatePublic(id);
  // Not null: React ignores a changed defaultValue on a mounted input, so the
  // form must re-seed from what was actually saved or it shows the old values.
  return { errors: {}, message: 'Sačuvano.', values: submittedValues(formData) };
}

export async function deleteTour(id: string) {
  await requireAdmin();
  const db = createAdminClient();
  await db.from('tours').delete().eq('id', id);
  revalidatePublic();
  redirect('/admin/tours');
}
