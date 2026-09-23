'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/auth/admin';
import { createAdminClient } from '@/lib/supabase/admin';
import { parsePropertyForm } from '@/lib/validation/property';
import { slugify } from '@/lib/slug';

/**
 * A "use server" module may only export async functions, so shared constants
 * live in the components that use them — only the type is exported here.
 */
export type FormState = {
  errors: Record<string, string>;
  message: string | null;
  /**
   * What the user typed, echoed back.
   *
   * React 19 resets an uncontrolled form's fields once its action resolves, so
   * without this a single validation error wipes the whole form. The component
   * re-seeds each field from here.
   */
  values: Record<string, string> | null;
};

/** Only string entries — a File has no place in a re-seeded text input. */
function submittedValues(formData: FormData): Record<string, string> {
  const values: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    if (typeof value === 'string') values[key] = value;
  }
  return values;
}

/**
 * Refresh every public surface that can show a property.
 * Server actions run outside the render pass, so Next has no way to know which
 * cached pages a write invalidates unless we say so.
 */
function revalidatePublic(id?: string) {
  revalidatePath('/', 'layout');
  revalidatePath('/admin/properties');
  // The edit page too: a server action re-renders the page it was called
  // from, and without this the form falls back to the values the page was
  // built with — showing the old title straight after a successful save.
  if (id) revalidatePath(`/admin/properties/${id}`);
}

/** Slugs must be unique; append -2, -3 … until one is free. */
async function uniqueSlug(base: string, excludeId?: string): Promise<string> {
  const db = createAdminClient();
  const root = base || 'nekretnina';

  for (let suffix = 0; suffix < 50; suffix += 1) {
    const candidate = suffix === 0 ? root : `${root}-${suffix + 1}`;
    const { data } = await db.from('properties').select('id').eq('slug', candidate).maybeSingle();
    if (!data || data.id === excludeId) return candidate;
  }
  return `${root}-${Date.now()}`;
}

export async function createProperty(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();

  const parsed = parsePropertyForm(formData);
  if (!parsed.ok) {
    return {
      errors: parsed.errors,
      message: 'Provjerite označena polja.',
      values: submittedValues(formData),
    };
  }

  const db = createAdminClient();
  const slug = await uniqueSlug(slugify(parsed.data.title_bs));

  const { data, error } = await db
    .from('properties')
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
  redirect(`/admin/properties/${data.id}`);
}

export async function updateProperty(
  id: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();

  const parsed = parsePropertyForm(formData);
  if (!parsed.ok) {
    return {
      errors: parsed.errors,
      message: 'Provjerite označena polja.',
      values: submittedValues(formData),
    };
  }

  const db = createAdminClient();
  const { error } = await db.from('properties').update(parsed.data).eq('id', id);

  if (error) {
    return {
      errors: {},
      message: `Greška pri spremanju: ${error.message}`,
      values: submittedValues(formData),
    };
  }

  revalidatePublic(id);
  return { errors: {}, message: 'Sačuvano.', values: null };
}

export async function deleteProperty(id: string) {
  await requireAdmin();

  const db = createAdminClient();
  // Remove stored photos first; the rows cascade with the property.
  const { data: images } = await db.from('property_images').select('url').eq('property_id', id);
  const storedPaths = (images ?? [])
    .map((image) => image.url)
    .filter((url) => url.includes('/property-images/'))
    .map((url) => url.split('/property-images/')[1]);

  if (storedPaths.length > 0) {
    await db.storage.from('property-images').remove(storedPaths);
  }

  const { error } = await db.from('properties').delete().eq('id', id);
  if (error) throw new Error(`Brisanje nije uspjelo: ${error.message}`);

  revalidatePublic();
  redirect('/admin/properties');
}
