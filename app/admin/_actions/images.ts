'use server';

import { revalidatePath } from 'next/cache';
import { requireContentAdmin } from '@/lib/auth/admin';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * Properties and projects store images identically, so these actions are shared
 * and the table name is chosen at runtime. A runtime table name cannot be
 * resolved by the typed client, so this file uses an untyped one — the shapes
 * are still enforced by CONFIG below and by the database itself.
 */
function imageDb(): SupabaseClient {
  return createAdminClient() as unknown as SupabaseClient;
}
import { storagePathFor, isAllowedImage } from '@/lib/storage';

export type ImageKind = 'property' | 'project';

const CONFIG = {
  property: { bucket: 'property-images', table: 'property_images', fk: 'property_id', adminPath: 'properties' },
  project: { bucket: 'project-images', table: 'project_images', fk: 'project_id', adminPath: 'projects' },
} as const;

/**
 * Refresh the public site and the edit page the upload happened on. Without
 * the second path the photo grid re-renders from the data the page was built
 * with, so a freshly uploaded photo does not appear until a manual reload.
 */
function revalidateFor(kind: ImageKind, ownerId?: string) {
  revalidatePath('/', 'layout');
  if (ownerId) revalidatePath(`/admin/${CONFIG[kind].adminPath}/${ownerId}`);
}

export type UploadState = { error: string | null; uploaded: number };

export async function uploadImages(
  kind: ImageKind,
  ownerId: string,
  _prev: UploadState,
  formData: FormData,
): Promise<UploadState> {
  await requireContentAdmin();

  const { bucket, table, fk } = CONFIG[kind];
  const files = formData.getAll('files').filter((f): f is File => f instanceof File && f.size > 0);

  if (files.length === 0) return { error: 'Niste odabrali nijednu sliku.', uploaded: 0 };

  const db = imageDb();

  const { data: existing } = await db
    .from(table)
    .select('sort_order')
    .eq(fk, ownerId)
    .order('sort_order', { ascending: false })
    .limit(1);

  let nextOrder = (existing?.[0]?.sort_order ?? 0) + 1;
  let uploaded = 0;

  for (const file of files) {
    if (!isAllowedImage(file.type, file.size)) {
      return {
        error: `"${file.name}" nije podržana slika ili je veća od 8 MB.`,
        uploaded,
      };
    }

    const path = storagePathFor(ownerId, file.name);
    const { error: uploadError } = await db.storage
      .from(bucket)
      .upload(path, file, { contentType: file.type, upsert: false });

    if (uploadError) return { error: `Greška pri uploadu: ${uploadError.message}`, uploaded };

    const { data: publicUrl } = db.storage.from(bucket).getPublicUrl(path);

    const { error: rowError } = await db
      .from(table)
      .insert({ [fk]: ownerId, url: publicUrl.publicUrl, sort_order: nextOrder });

    if (rowError) {
      // The row is what makes the file visible; a file with no row is invisible
      // and would leak storage, so remove it rather than leave it orphaned.
      await db.storage.from(bucket).remove([path]);
      return { error: `Greška pri spremanju: ${rowError.message}`, uploaded };
    }

    nextOrder += 1;
    uploaded += 1;
  }

  revalidateFor(kind, ownerId);
  return { error: null, uploaded };
}

export async function deleteImage(kind: ImageKind, imageId: string) {
  await requireContentAdmin();
  const { bucket, table, fk } = CONFIG[kind];
  const db = imageDb();

  const { data: image } = await db.from(table).select(`url, ${fk}`).eq('id', imageId).single();

  if (image?.url?.includes(`/${bucket}/`)) {
    await db.storage.from(bucket).remove([image.url.split(`/${bucket}/`)[1]]);
  }

  await db.from(table).delete().eq('id', imageId);

  // `fk` is chosen at runtime, so the row's shape is a union here; read the
  // owner id through an index signature rather than widening the query type.
  const ownerId = (image as Record<string, string> | null)?.[fk];
  revalidateFor(kind, ownerId);
}

/** Swap two images' positions. Reordering the cover is the common case. */
export async function moveImage(kind: ImageKind, imageId: string, direction: 'up' | 'down') {
  await requireContentAdmin();
  const { table, fk } = CONFIG[kind];
  const db = imageDb();

  const { data: current } = await db
    .from(table)
    .select(`id, sort_order, ${fk}`)
    .eq('id', imageId)
    .single();
  if (!current) return;

  const owner = (current as Record<string, unknown>)[fk];

  const { data: neighbour } = await db
    .from(table)
    .select('id, sort_order')
    .eq(fk, owner)
    [direction === 'up' ? 'lt' : 'gt']('sort_order', current.sort_order)
    .order('sort_order', { ascending: direction !== 'up' })
    .limit(1)
    .maybeSingle();

  if (!neighbour) return;

  await db.from(table).update({ sort_order: neighbour.sort_order }).eq('id', current.id);
  await db.from(table).update({ sort_order: current.sort_order }).eq('id', neighbour.id);

  revalidateFor(kind, owner as string);
}
