import { slugify } from './slug';

export const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

/**
 * What may be stored. HEIC is included because an iPhone produces it by
 * default and the picker offers it — rejecting it server-side left people
 * unable to upload their own photos. The browser converts HEIC to WebP before
 * sending whenever it can decode it, so this is the fallback path.
 */
const ALLOWED_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/avif',
  'image/gif',
  'image/heic',
  'image/heif',
];

export function isAllowedImage(mimeType: string, size: number): boolean {
  if (size <= 0 || size > MAX_IMAGE_BYTES) return false;
  return ALLOWED_TYPES.includes(mimeType.toLowerCase());
}

/**
 * Storage key for an uploaded photo: `<ownerId>/<timestamp>-<slug>.<ext>`.
 *
 * The filename comes from the browser, so it is untrusted: only the last path
 * segment is used and it is slugified, which removes any `..` or `/` before it
 * can escape the owner's folder.
 */
export function storagePathFor(ownerId: string, filename: string, now = Date.now()): string {
  const base = filename.split('/').pop() ?? '';
  const dot = base.lastIndexOf('.');

  const rawName = dot > 0 ? base.slice(0, dot) : base;
  const rawExt = dot > 0 ? base.slice(dot + 1) : '';

  const name = slugify(rawName) || 'slika';
  const ext = slugify(rawExt) || 'jpg';

  return `${ownerId}/${now}-${name}.${ext}`;
}
