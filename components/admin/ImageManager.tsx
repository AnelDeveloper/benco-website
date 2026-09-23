'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import Image from 'next/image';
import { ArrowLeft, ArrowRight, Trash2, Upload } from 'lucide-react';
import { uploadImages, deleteImage, moveImage, type ImageKind, type UploadState } from '@/app/admin/_actions/images';

type ImageItem = { id: string; url: string; sort_order: number };

function UploadButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 text-sm font-medium text-white transition hover:bg-slate-700 disabled:opacity-60 sm:w-auto"
    >
      <Upload size={16} /> {pending ? 'Upload u toku…' : 'Dodaj slike'}
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

      <form action={formAction} className="flex flex-wrap items-center gap-3">
        <input
          type="file"
          name="files"
          multiple
          accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
          className="text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-sm file:font-medium file:text-slate-700 hover:file:bg-slate-200"
        />
        <UploadButton />
      </form>
    </section>
  );
}
