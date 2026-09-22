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
export type FormState = { errors: Record<string, string>; message: string | null };

/**
 * Refresh every public surface that can show a property.
 * Server actions run outside the render pass, so Next has no way to know which
 * cached pages a write invalidates unless we say so.
 */
function revalidatePublic() {
  revalidatePath('/', 'layout');
  revalidatePath('/admin/properties');
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
  if (!parsed.ok) return { errors: parsed.errors, message: 'Provjerite označena polja.' };

  const db = createAdminClient();
  const slug = await uniqueSlug(slugify(parsed.data.title_bs));

  const { data, error } = await db
    .from('properties')
    .insert({ ...parsed.data, slug })
    .select('id')
    .single();

  if (error || !data) {
    return { errors: {}, message: `Greška pri spremanju: ${error?.message ?? 'nepoznato'}` };
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
  if (!parsed.ok) return { errors: parsed.errors, message: 'Provjerite označena polja.' };

  const db = createAdminClient();
  const { error } = await db.from('properties').update(parsed.data).eq('id', id);

  if (error) return { errors: {}, message: `Greška pri spremanju: ${error.message}` };

  revalidatePublic();
  return { errors: {}, message: 'Sačuvano.' };
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

export async function togglePublished(id: string, next: boolean) {
  await requireAdmin();
  const db = createAdminClient();
  await db.from('properties').update({ is_published: next }).eq('id', id);
  revalidatePublic();
}
