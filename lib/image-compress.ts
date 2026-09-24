/**
 * Shrink photos in the browser before they are uploaded.
 *
 * A photo straight off a phone is 3–5 MB. Uploading that over mobile data is
 * slow, and a few hundred of them would fill the Supabase free tier. Resizing
 * to a sensible long edge and re-encoding typically takes 4 MB down to under
 * 500 KB with no visible difference at the sizes this site displays.
 */

export const MAX_EDGE = 2200;
export const QUALITY = 0.82;

/** Formats every browser can display. Anything else must be converted first. */
const WEB_SAFE = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/avif', 'image/gif'];

export function isWebSafe(mimeType: string): boolean {
  return WEB_SAFE.includes(mimeType.toLowerCase());
}

/** Scale to fit inside a square of `max`, never enlarging a smaller image. */
export function fitWithin(
  width: number,
  height: number,
  max = MAX_EDGE,
): { width: number; height: number } {
  if (width <= 0 || height <= 0) return { width: 0, height: 0 };
  if (width <= max && height <= max) return { width, height };

  const scale = max / Math.max(width, height);
  return {
    width: Math.round(width * scale),
    height: Math.round(height * scale),
  };
}

/** Swap the extension for the format we actually encoded. */
export function renameTo(filename: string, mimeType: string): string {
  const ext = mimeType === 'image/webp' ? 'webp' : 'jpg';
  const base = filename.replace(/\.[^.]+$/, '');
  return `${base || 'slika'}.${ext}`;
}

/**
 * Returns a smaller File, or the original when shrinking is not possible or
 * would not help. Never throws: a failed compression must not block an upload.
 */
export async function compressImage(file: File): Promise<File> {
  // GIFs may be animated, and canvas would flatten them to a single frame.
  if (file.type === 'image/gif') return file;
  if (typeof createImageBitmap !== 'function' || typeof document === 'undefined') return file;

  try {
    const bitmap = await createImageBitmap(file);
    const { width, height } = fitWithin(bitmap.width, bitmap.height);

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext('2d');
    if (!context) return file;

    context.drawImage(bitmap, 0, 0, width, height);
    bitmap.close?.();

    const type = 'image/webp';
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, type, QUALITY),
    );

    // If re-encoding gained nothing, keep the original.
    if (!blob || blob.size >= file.size) return file;

    return new File([blob], renameTo(file.name, type), { type, lastModified: Date.now() });
  } catch {
    // HEIC and anything else the browser cannot decode lands here; the server
    // still validates type and size, so uploading the original is safe.
    return file;
  }
}
