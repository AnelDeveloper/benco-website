'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireContentAdmin } from '@/lib/auth/admin';
import { createAdminClient } from '@/lib/supabase/admin';
import { parseProjectForm } from '@/lib/validation/property';
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
  revalidatePath('/admin/projects');
  if (id) revalidatePath(`/admin/projects/${id}`);
}

async function uniqueSlug(base: string, excludeId?: string): Promise<string> {
  const db = createAdminClient();
  const root = base || 'projekat';

  for (let suffix = 0; suffix < 50; suffix += 1) {
    const candidate = suffix === 0 ? root : `${root}-${suffix + 1}`;
    const { data } = await db.from('projects').select('id').eq('slug', candidate).maybeSingle();
    if (!data || data.id === excludeId) return candidate;
  }
  return `${root}-${Date.now()}`;
}

export async function createProject(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireContentAdmin();

  const parsed = parseProjectForm(formData);
  if (!parsed.ok) {
    return { errors: parsed.errors, message: 'Provjerite označena polja.', values: submittedValues(formData) };
  }

  const db = createAdminClient();
  const slug = await uniqueSlug(slugify(parsed.data.title_bs));

  const { data, error } = await db
    .from('projects')
    .insert({ ...parsed.data, slug })
    .select('id')
    .single();

  if (error || !data) {
    return {
      errors: {},
      message: `Greška pri spremanju: ${error?.message ?? 'nepoznato'}`,
      values: submittedValues(formData),
    };
  }

  revalidatePublic();
  redirect(`/admin/projects/${data.id}`);
}

export async function updateProject(
  id: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireContentAdmin();

  const parsed = parseProjectForm(formData);
  if (!parsed.ok) {
    return { errors: parsed.errors, message: 'Provjerite označena polja.', values: submittedValues(formData) };
  }

  const db = createAdminClient();
  const { error } = await db.from('projects').update(parsed.data).eq('id', id);

  if (error) {
    return { errors: {}, message: `Greška pri spremanju: ${error.message}`, values: submittedValues(formData) };
  }

  revalidatePublic(id);
  // Not null: React ignores a changed defaultValue on a mounted input, so the
  // form must re-seed from what was actually saved or it shows the old values.
  return { errors: {}, message: 'Sačuvano.', values: submittedValues(formData) };
}

export async function deleteProject(id: string) {
  await requireContentAdmin();
  const db = createAdminClient();

  const { data: images } = await db.from('project_images').select('url').eq('project_id', id);
  const paths = (images ?? [])
    .map((image) => image.url)
    .filter((url) => url.includes('/project-images/'))
    .map((url) => url.split('/project-images/')[1]);

  if (paths.length > 0) await db.storage.from('project-images').remove(paths);

  await db.from('projects').delete().eq('id', id);
  revalidatePublic();
  redirect('/admin/projects');
}

// --- Milestones -------------------------------------------------------------

export async function addMilestone(projectId: string, formData: FormData) {
  await requireContentAdmin();
  const db = createAdminClient();

  const title_bs = String(formData.get('title_bs') ?? '').trim();
  const title_en = String(formData.get('title_en') ?? '').trim();
  if (!title_bs) return;

  const { data: last } = await db
    .from('project_milestones')
    .select('sort_order')
    .eq('project_id', projectId)
    .order('sort_order', { ascending: false })
    .limit(1);

  const targetDate = String(formData.get('target_date') ?? '').trim();

  await db.from('project_milestones').insert({
    project_id: projectId,
    title_bs,
    title_en: title_en || title_bs,
    target_date: targetDate === '' ? null : targetDate,
    is_done: formData.get('is_done') === 'on',
    sort_order: (last?.[0]?.sort_order ?? 0) + 1,
  });

  revalidatePublic(projectId);
}

export async function toggleMilestone(id: string, next: boolean) {
  await requireContentAdmin();
  const db = createAdminClient();

  const { data } = await db.from('project_milestones').select('project_id').eq('id', id).maybeSingle();
  await db
    .from('project_milestones')
    .update({ is_done: next, completed_at: next ? new Date().toISOString().slice(0, 10) : null })
    .eq('id', id);

  revalidatePublic(data?.project_id);
}

export async function deleteMilestone(id: string) {
  await requireContentAdmin();
  const db = createAdminClient();

  const { data } = await db.from('project_milestones').select('project_id').eq('id', id).maybeSingle();
  await db.from('project_milestones').delete().eq('id', id);

  revalidatePublic(data?.project_id);
}
