import Link from 'next/link';
import Image from 'next/image';
import { Plus, Pencil, ImageOff } from 'lucide-react';
import { requireContentAdmin } from '@/lib/auth/admin';
import { createAdminClient } from '@/lib/supabase/admin';
import type { TourRow } from '@/lib/supabase/types';

export const dynamic = 'force-dynamic';

export default async function ToursPage() {
  await requireContentAdmin();
  const db = createAdminClient();
  const { data } = await db.from('tours').select('*').order('sort_order');
  const tours = (data ?? []) as TourRow[];

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Ture autom</h1>
          <p className="mt-1 text-slate-600">{tours.length} ukupno</p>
        </div>
        <Link
          href="/admin/tours/new"
          className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-gold-600 px-4 font-semibold text-white transition hover:bg-gold-500"
        >
          <Plus size={18} /> Dodaj turu
        </Link>
      </div>

      {tours.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-600">
          Još nema tura.
        </div>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {tours.map((tour) => (
            <li key={tour.id}>
              <Link
                href={`/admin/tours/${tour.id}`}
                className="flex gap-4 rounded-xl border border-slate-200 bg-white p-4 transition hover:border-gold-500 hover:shadow-md"
              >
                <div className="relative h-20 w-28 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                  {tour.cover_url ? (
                    <Image src={tour.cover_url} alt="" fill className="object-cover" sizes="112px" />
                  ) : (
                    <span className="flex h-full items-center justify-center text-slate-400"><ImageOff size={18} /></span>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <h2 className="font-semibold text-slate-900">{tour.title_bs}</h2>
                    <span className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-slate-200 px-2 py-0.5 text-xs text-slate-600">
                      <Pencil size={11} /> Uredi
                    </span>
                  </div>
                  <p className="mt-0.5 text-sm text-slate-500">
                    {tour.duration_hours ?? '—'} h · {tour.distance_km ?? '—'} km · {tour.price_per_person ?? '—'} {tour.currency}
                  </p>
                  <span
                    className={`mt-2 inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      tour.is_published ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {tour.is_published ? 'Objavljeno' : 'Skica'}
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
