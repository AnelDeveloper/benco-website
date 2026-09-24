'use client';

import { useActionState, useRef, useState } from 'react';
import { useFormStatus } from 'react-dom';
import Image from 'next/image';
import { ArrowLeft, ArrowRight, Trash2, Upload } from 'lucide-react';
import { uploadImages, deleteImage, moveImage, type ImageKind, type UploadState } from '@/app/admin/_actions/images';
import { compressImage, isWebSafe } from '@/lib/image-compress';

type ImageItem = { id: string; url: string; sort_order: number };

function UploadButton({ preparing }: { preparing: boolean }) {
  const { pending } = useFormStatus();
  const busy = pending || preparing;
  return (
    <button
      type="submit"
      disabled={busy}
      className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 text-sm font-medium text-white transition hover:bg-slate-700 disabled:opacity-60 sm:w-auto"
    >
      <Upload size={16} /> {preparing ? 'Priprema slika…' : pending ? 'Upload u toku…' : 'Dodaj slike'}
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
  const action = uploadImages.bind(null, kind, ownerId);
  const [state, formAction] = useActionState<UploadState, FormData>(action, {
    error: null,
    uploaded: 0,
  });

  const inputRef = useRef<HTMLInputElement>(null);
  const [preparing, setPreparing] = useState(false);
  const [saved, setSaved] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);

  /**
   * Shrink each photo in the browser, then hand the smaller files to the
   * server action. A phone photo is 3-5 MB; uploading that over mobile data is
   * slow and fills the storage quota quickly, so the resize happens before a
   * single byte leaves the device.
   */
  async function prepareAndSubmit(formData: FormData) {
    const chosen = formData.getAll('files').filter((f): f is File => f instanceof File && f.size > 0);
    if (chosen.length === 0) return formAction(formData);

    setPreparing(true);
    setSaved(null);
    setWarning(null);

    const before = chosen.reduce((sum, f) => sum + f.size, 0);
    const compressed = await Promise.all(chosen.map(compressImage));
    const after = compressed.reduce((sum, f) => sum + f.size, 0);

    const next = new FormData();
    for (const file of compressed) next.append('files', file);

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

    setPreparing(false);
    if (inputRef.current) inputRef.current.value = '';
    return formAction(next);
  }

  const sorted = [...images].sort((a, b) => a.sort_order - b.sort_order);

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5">
      <h2 className="font-semibold text-slate-900">Slike</h2>
      <p className="mb-4 text-sm text-slate-500">
        Prva slika je naslovna i prikazuje se na naslovnoj strani.
      </p>

      {state.error && (
        <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
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

      <form action={prepareAndSubmit} className="flex flex-wrap items-center gap-3">
        <input
          ref={inputRef}
          type="file"
          name="files"
          multiple
          accept="image/*"
          className="w-full text-sm text-slate-600 file:mr-3 file:min-h-11 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:text-sm file:font-medium file:text-slate-700 hover:file:bg-slate-200 sm:w-auto"
        />
        <UploadButton preparing={preparing} />
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
