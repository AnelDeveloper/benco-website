'use client';

import { useActionState } from 'react';
import { Field, TextareaField, SelectField, CheckboxField, SubmitButton } from './Fields';
import type { FormState } from '@/app/admin/_actions/properties';
import type { PropertyRow } from '@/lib/supabase/types';

const TYPES = [
  { value: 'villa', label: 'Vila' },
  { value: 'apartment', label: 'Apartman' },
  { value: 'house', label: 'Kuća' },
  { value: 'land', label: 'Zemljište' },
];

const MODES = [
  { value: 'sale', label: 'Prodaja' },
  { value: 'rent', label: 'Najam' },
  { value: 'both', label: 'Prodaja i najam' },
];

export function PropertyForm({
  action,
  property,
  submitLabel,
}: {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  property?: PropertyRow;
  submitLabel?: string;
}) {
  const [state, formAction] = useActionState<FormState, FormData>(action, {
    errors: {},
    message: null,
  });
  const e = state.errors;

  return (
    <form action={formAction} className="space-y-6">
      {state.message && (
        <p
          className={`rounded-lg px-3 py-2 text-sm ${
            Object.keys(e).length > 0
              ? 'bg-red-50 text-red-700'
              : 'bg-green-50 text-green-700'
          }`}
        >
          {state.message}
        </p>
      )}

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="mb-4 font-semibold text-slate-900">Osnovni podaci</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Field name="title_bs" label="Naslov (BS)" required defaultValue={property?.title_bs} error={e.title_bs} />
          <Field name="title_en" label="Naslov (EN)" required defaultValue={property?.title_en} error={e.title_en} />
          <TextareaField name="description_bs" label="Opis (BS)" defaultValue={property?.description_bs} error={e.description_bs} />
          <TextareaField name="description_en" label="Opis (EN)" defaultValue={property?.description_en} error={e.description_en} />
          <SelectField name="property_type" label="Tip" required options={TYPES} defaultValue={property?.property_type} error={e.property_type} />
          <SelectField name="listing_mode" label="Vrsta oglasa" required options={MODES} defaultValue={property?.listing_mode} error={e.listing_mode} />
          <Field name="location" label="Lokacija" required defaultValue={property?.location} error={e.location} hint="npr. Sarajevo, Jahorina" />
          <Field name="address" label="Adresa" defaultValue={property?.address} error={e.address} />
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="mb-1 font-semibold text-slate-900">Cijena</h2>
        <p className="mb-4 text-sm text-slate-500">
          Cijena prodaje je obavezna za prodaju, cijena po noći za najam.
        </p>
        <div className="grid gap-4 md:grid-cols-3">
          <Field name="price" label="Cijena (prodaja)" type="number" step="0.01" defaultValue={property?.price} error={e.price} />
          <Field name="price_per_night" label="Cijena po noći (najam)" type="number" step="0.01" defaultValue={property?.price_per_night} error={e.price_per_night} />
          <Field name="currency" label="Valuta" defaultValue={property?.currency ?? 'BAM'} error={e.currency} />
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="mb-4 font-semibold text-slate-900">Detalji</h2>
        <div className="grid gap-4 md:grid-cols-4">
          <Field name="area_m2" label="Površina (m²)" type="number" step="0.01" defaultValue={property?.area_m2} error={e.area_m2} />
          <Field name="bedrooms" label="Spavaće sobe" type="number" defaultValue={property?.bedrooms} error={e.bedrooms} />
          <Field name="bathrooms" label="Kupatila" type="number" defaultValue={property?.bathrooms} error={e.bathrooms} />
          <Field name="max_guests" label="Max. gostiju" type="number" defaultValue={property?.max_guests} error={e.max_guests} hint="za najam" />
        </div>
        <div className="mt-4">
          <Field
            name="features"
            label="Sadržaji"
            defaultValue={property?.features?.join(', ')}
            hint="Odvojite zarezom: bazen, garaža, vrt"
            error={e.features}
          />
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="mb-4 font-semibold text-slate-900">Objavljivanje</h2>
        <div className="grid gap-3 md:grid-cols-2">
          <CheckboxField name="is_published" label="Objavljeno" hint="Vidljivo posjetiteljima sajta" defaultChecked={property?.is_published} />
          <CheckboxField name="is_featured" label="Istaknuto" hint="Prikazuje se na naslovnoj strani" defaultChecked={property?.is_featured ?? true} />
        </div>
        <div className="mt-4 max-w-xs">
          <Field name="sort_order" label="Redoslijed" type="number" defaultValue={property?.sort_order ?? 0} hint="Manji broj = ranije" error={e.sort_order} />
        </div>
      </section>

      <SubmitButton>{submitLabel ?? 'Sačuvaj'}</SubmitButton>
    </form>
  );
}
