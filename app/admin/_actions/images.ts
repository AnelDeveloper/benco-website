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

export type UploadRequest = { name: string; type: string; size: number };
export type UploadTarget = { path: string; token: string };

/**
 * Step 1 of an upload: hand the browser one signed URL per photo.
 *
 * Photos no longer pass through this server. Vercel refuses any request body
 * over 4.5 MB before the function even runs, and seven phone photos in one
 * form easily exceed that — the browser got an unreadable response and the
 * whole admin page crashed. The browser now uploads each file straight to
 * Supabase Storage, so only a few bytes of metadata come through here.
 */
export async function prepareUploads(
  kind: ImageKind,
  ownerId: string,
  files: UploadRequest[],
): Promise<{ error: string } | { bucket: string; targets: UploadTarget[] }> {
  await requireContentAdmin();

  if (files.length === 0) return { error: 'Niste odabrali nijednu sliku.' };

  for (const file of files) {
    if (!isAllowedImage(file.type, file.size)) {
      return { error: `"${file.name}" nije podržana slika ili je veća od 8 MB.` };
    }
  }

  const { bucket } = CONFIG[kind];
  const db = imageDb();
  const now = Date.now();
  const targets: UploadTarget[] = [];

  for (const [index, file] of files.entries()) {
    // Offset the timestamp so two photos with the same name cannot collide.
    const path = storagePathFor(ownerId, file.name, now + index);
    const { data, error } = await db.storage.from(bucket).createSignedUploadUrl(path);
    if (error || !data) return { error: `Greška pri pripremi uploada: ${error?.message ?? 'nepoznato'}` };
    targets.push({ path: data.path, token: data.token });
  }

  return { bucket, targets };
}

/**
 * Step 2: record the photos the browser finished uploading, in the order
 * chosen. Only paths inside this owner's folder are accepted, so a tampered
 * request cannot attach another listing's files.
 */
export async function saveUploads(
  kind: ImageKind,
  ownerId: string,
  paths: string[],
): Promise<{ error: string | null; saved: number }> {
  await requireContentAdmin();

  const { bucket, table, fk } = CONFIG[kind];
  const valid = paths.filter((p) => p.startsWith(`${ownerId}/`) && !p.includes('..'));
  if (valid.length === 0) return { error: null, saved: 0 };

  const db = imageDb();

  const { data: existing } = await db
    .from(table)
    .select('sort_order')
    .eq(fk, ownerId)
    .order('sort_order', { ascending: false })
    .limit(1);

  const first = (existing?.[0]?.sort_order ?? 0) + 1;
  const rows = valid.map((path, i) => ({
    [fk]: ownerId,
    url: db.storage.from(bucket).getPublicUrl(path).data.publicUrl,
    sort_order: first + i,
  }));

  const { error } = await db.from(table).insert(rows);
  if (error) {
    // The row is what makes the file visible; a file with no row is invisible
    // and would leak storage, so remove them rather than leave them orphaned.
    await db.storage.from(bucket).remove(valid);
    return { error: `Greška pri spremanju: ${error.message}`, saved: 0 };
  }

  revalidateFor(kind, ownerId);
  return { error: null, saved: rows.length };
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
