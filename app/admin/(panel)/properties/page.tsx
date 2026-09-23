import Link from 'next/link';
import Image from 'next/image';
import { Plus, Pencil, ImageOff } from 'lucide-react';
import { requireContentAdmin } from '@/lib/auth/admin';
import { listPropertiesForAdmin, coverOf } from '@/lib/data/admin-properties';

export const dynamic = 'force-dynamic';

const TYPE_LABEL: Record<string, string> = {
  villa: 'Vila', apartment: 'Apartman', house: 'Kuća', land: 'Zemljište',
};
const MODE_LABEL: Record<string, string> = {
  sale: 'Prodaja', rent: 'Najam', both: 'Prodaja i najam',
};

export default async function PropertiesPage() {
  await requireContentAdmin();
  const properties = await listPropertiesForAdmin();

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Nekretnine</h1>
          <p className="mt-1 text-slate-600">{properties.length} ukupno</p>
        </div>
        <Link
          href="/admin/properties/new"
          className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-gold-600 px-4 font-semibold text-white transition hover:bg-gold-500"
        >
          <Plus size={18} /> Dodaj nekretninu
        </Link>
      </div>

      {properties.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <p className="text-slate-600">Još nema nekretnina.</p>
        </div>
      ) : (
        <>
          {/* Phones: cards. A six-column table at 390px is unreadable and
              scrolls sideways, and every row is a tap target anyway. */}
          <ul className="space-y-3 md:hidden">
            {properties.map((property) => {
              const cover = coverOf(property.property_images ?? []);
              return (
                <li key={property.id}>
                  <Link
                    href={`/admin/properties/${property.id}`}
                    className="flex gap-3 rounded-xl border border-slate-200 bg-white p-3 active:bg-slate-50"
                  >
                    <div className="relative h-20 w-24 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                      {cover ? (
                        <Image src={cover} alt="" fill className="object-cover" sizes="96px" />
                      ) : (
                        <span className="flex h-full items-center justify-center text-slate-400">
                          <ImageOff size={18} />
                        </span>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-slate-900">{property.title_bs}</p>
                      <p className="mt-0.5 text-sm text-slate-500">
                        {TYPE_LABEL[property.property_type]} · {property.location}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {MODE_LABEL[property.listing_mode]} · {property.property_images?.length ?? 0} slika
                      </p>
                      <span
                        className={`mt-2 inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          property.is_published ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {property.is_published ? 'Objavljeno' : 'Skica'}
                      </span>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>

          <div className="hidden overflow-hidden rounded-xl border border-slate-200 bg-white md:block">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-4 py-3 font-medium">Slika</th>
                  <th className="px-4 py-3 font-medium">Naslov</th>
                  <th className="px-4 py-3 font-medium">Tip</th>
                  <th className="hidden px-4 py-3 font-medium lg:table-cell">Lokacija</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {properties.map((property) => {
                  const cover = coverOf(property.property_images ?? []);
                  return (
                    <tr key={property.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <div className="relative h-12 w-16 overflow-hidden rounded bg-slate-100">
                          {cover ? (
                            <Image src={cover} alt="" fill className="object-cover" sizes="64px" />
                          ) : (
                            <span className="flex h-full items-center justify-center text-slate-400">
                              <ImageOff size={16} />
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Link href={`/admin/properties/${property.id}`} className="font-medium text-slate-900 hover:text-gold-600">
                          {property.title_bs}
                        </Link>
                        <p className="text-xs text-slate-500">
                          {MODE_LABEL[property.listing_mode]} · {property.property_images?.length ?? 0} slika
                        </p>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{TYPE_LABEL[property.property_type]}</td>
                      <td className="hidden px-4 py-3 text-slate-600 lg:table-cell">{property.location}</td>
                      <td className="px-4 py-3">
                        {property.is_published ? (
                          <span className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700">
                            Objavljeno
                          </span>
                        ) : (
                          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                            Skica
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/admin/properties/${property.id}`}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-slate-700 transition hover:bg-slate-100"
                        >
                          <Pencil size={14} /> Uredi
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

    </div>
  );
}
