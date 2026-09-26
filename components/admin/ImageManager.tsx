'use client';

import { useRef, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { ArrowLeft, ArrowRight, Trash2, Upload } from 'lucide-react';
import { prepareUploads, saveUploads, deleteImage, moveImage, type ImageKind } from '@/app/admin/_actions/images';
import { compressImage, isWebSafe } from '@/lib/image-compress';
import { browserClient } from '@/lib/supabase/browser';

type ImageItem = { id: string; url: string; sort_order: number };

function UploadButton({ status }: { status: string | null }) {
  return (
    <button
      type="submit"
      disabled={status !== null}
      className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 text-sm font-medium text-white transition hover:bg-slate-700 disabled:opacity-60 sm:w-auto"
    >
      <Upload size={16} /> {status ?? 'Dodaj slike'}
    </button>
  );
}

export function ImageManager({
  ownerId,
  kind,
  images,
}: {
  ownerId: string;
  kind: ImageKind;
  images: ImageItem[];
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const router = useRouter();

  /**
   * Shrink each photo in the browser, then upload it straight to storage.
   * A phone photo is 3-5 MB; uploading that over mobile data is slow and
   * fills the storage quota quickly, so the resize happens before a single
   * byte leaves the device. Files go directly to Supabase rather than through
   * the server, whose platform caps a request at 4.5 MB.
   */
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const chosen = Array.from(inputRef.current?.files ?? []).filter((f) => f.size > 0);

    setError(null);
    setSaved(null);
    setWarning(null);
    if (chosen.length === 0) {
      setError('Niste odabrali nijednu sliku.');
      return;
    }

    try {
      setStatus('Priprema slika…');
      const before = chosen.reduce((sum, f) => sum + f.size, 0);
      const compressed = await Promise.all(chosen.map(compressImage));
      const after = compressed.reduce((sum, f) => sum + f.size, 0);

      const pct = before > 0 ? Math.round((1 - after / before) * 100) : 0;
      setSaved(pct > 2 ? `${(before / 1048576).toFixed(1)} MB → ${(after / 1048576).toFixed(1)} MB (−${pct}%)` : null);

      // Safari can decode HEIC and converts it above; browsers that cannot would
      // otherwise store a file Chrome and Firefox refuse to show.
      const unconverted = compressed.filter((file) => !isWebSafe(file.type));
      if (unconverted.length > 0) {
        setWarning(
          `${unconverted.map((f) => f.name).join(', ')} — ovaj format možda neće biti vidljiv u svim ` +
          `pretraživačima. Na iPhoneu: Postavke → Kamera → Formati → "Najkompatibilnije".`,
        );
      }

      const prepared = await prepareUploads(
        kind,
        ownerId,
        compressed.map((f) => ({ name: f.name, type: f.type, size: f.size })),
      );
      if ('error' in prepared) {
        setError(prepared.error);
        return;
      }

      let done = 0;
      setStatus(`Upload 0/${compressed.length}…`);
      const storage = browserClient().storage.from(prepared.bucket);
      const results = await Promise.all(
        prepared.targets.map(async (target, i) => {
          const { error: uploadError } = await storage.uploadToSignedUrl(target.path, target.token, compressed[i], {
            contentType: compressed[i].type,
          });
          done += 1;
          setStatus(`Upload ${done}/${compressed.length}…`);
          return { name: compressed[i].name, path: uploadError ? null : target.path };
        }),
      );

      const paths = results.flatMap((r) => (r.path ? [r.path] : []));
      const failed = results.filter((r) => !r.path).map((r) => r.name);

      setStatus('Spremanje…');
      const result = await saveUploads(kind, ownerId, paths);
      if (result.error) setError(result.error);
      else if (failed.length > 0) setError(`Nije uspio upload: ${failed.join(', ')}. Pokušajte ponovo s tim slikama.`);

      if (inputRef.current) inputRef.current.value = '';
      // Pick up the revalidated page so the new photos appear in the grid.
      router.refresh();
    } catch (e) {
      // A network drop or an expired session must show a message, not take
      // the whole admin page down with it.
      console.error(e);
      setError('Upload nije uspio. Provjerite internet vezu i pokušajte ponovo.');
    } finally {
      setStatus(null);
    }
  }

  const sorted = [...images].sort((a, b) => a.sort_order - b.sort_order);

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5">
      <h2 className="font-semibold text-slate-900">Slike</h2>
      <p className="mb-4 text-sm text-slate-500">
        Prva slika je naslovna i prikazuje se na naslovnoj strani.
      </p>

      {error && (
        <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      {sorted.length === 0 ? (
        <p className="mb-4 rounded-lg border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
          Još nema slika.
        </p>
      ) : (
        <ul className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {sorted.map((image, index) => (
            <li key={image.id} className="group relative overflow-hidden rounded-lg border border-slate-200">
              <div className="relative aspect-[4/3] bg-slate-100">
                <Image src={image.url} alt="" fill className="object-cover" sizes="200px" />
                {index === 0 && (
                  <span className="absolute left-1.5 top-1.5 rounded bg-gold-600 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                    NASLOVNA
                  </span>
                )}
              </div>
              <div className="flex items-stretch gap-1 border-t border-slate-200 p-1">
                <form action={moveImage.bind(null, kind, image.id, 'up')}>
                  <button
                    type="submit"
                    disabled={index === 0}
                    aria-label="Pomjeri lijevo"
                    className="flex h-11 flex-1 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 disabled:opacity-30"
                  >
                    <ArrowLeft size={15} />
                  </button>
                </form>
                <form action={moveImage.bind(null, kind, image.id, 'down')}>
                  <button
                    type="submit"
                    disabled={index === sorted.length - 1}
                    aria-label="Pomjeri desno"
                    className="flex h-11 flex-1 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 disabled:opacity-30"
                  >
                    <ArrowRight size={15} />
                  </button>
                </form>
                <form action={deleteImage.bind(null, kind, image.id)}>
                  <button
                    type="submit"
                    aria-label="Obriši sliku"
                    className="flex h-11 flex-1 items-center justify-center rounded-lg text-red-600 hover:bg-red-50"
                  >
                    <Trash2 size={15} />
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={handleSubmit} className="flex flex-wrap items-center gap-3">
        <input
          ref={inputRef}
          type="file"
          name="files"
          multiple
          accept="image/*"
          className="w-full text-sm text-slate-600 file:mr-3 file:min-h-11 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:text-sm file:font-medium file:text-slate-700 hover:file:bg-slate-200 sm:w-auto"
        />
        <UploadButton status={status} />
      </form>

      {saved && (
        <p className="mt-2 text-xs text-green-700">Slike smanjene prije slanja: {saved}</p>
      )}
      {warning && (
        <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">{warning}</p>
      )}
      <p className="mt-2 text-xs text-slate-500">
        Slike se automatski smanjuju na najviše 2200 px prije slanja, da ne troše prostor i podatke.
      </p>
    </section>
  );
}
