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
    values: null,
  });
  const e = state.errors;

  /** Prefer what the user just typed, then the saved row, then blank. */
  const v = (name: keyof PropertyRow, fallback?: string | number | null) =>
    state.values?.[name] ?? fallback ?? (property?.[name] as string | number | null | undefined) ?? '';

  const checked = (name: 'is_published' | 'is_featured', fallback: boolean) =>
    state.values ? state.values[name] === 'on' : (property?.[name] ?? fallback);

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
          <Field name="title_bs" label="Naslov (BS)" required defaultValue={v('title_bs')} error={e.title_bs} />
          <Field name="title_en" label="Naslov (EN)" required defaultValue={v('title_en')} error={e.title_en} />
          <TextareaField name="description_bs" label="Opis (BS)" defaultValue={String(v('description_bs'))} error={e.description_bs} />
          <TextareaField name="description_en" label="Opis (EN)" defaultValue={String(v('description_en'))} error={e.description_en} />
          <SelectField name="property_type" label="Tip" required options={TYPES} defaultValue={String(v('property_type'))} error={e.property_type} />
          <SelectField name="listing_mode" label="Vrsta oglasa" required options={MODES} defaultValue={String(v('listing_mode'))} error={e.listing_mode} />
          <Field name="location" label="Lokacija" required defaultValue={v('location')} error={e.location} hint="npr. Sarajevo, Jahorina" />
          <Field name="address" label="Adresa" defaultValue={String(v('address'))} error={e.address} />
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="mb-1 font-semibold text-slate-900">Cijena</h2>
        <p className="mb-4 text-sm text-slate-500">
          Cijena prodaje je obavezna za prodaju, cijena po noći za najam.
        </p>
        <div className="grid gap-4 md:grid-cols-3">
          <Field name="price" label="Cijena (prodaja)" type="number" step="0.01" defaultValue={v('price')} error={e.price} />
          <Field name="price_per_night" label="Cijena po noći (najam)" type="number" step="0.01" defaultValue={v('price_per_night')} error={e.price_per_night} />
          <Field name="currency" label="Valuta" defaultValue={v('currency', 'BAM')} error={e.currency} />
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="mb-4 font-semibold text-slate-900">Detalji</h2>
        <div className="grid gap-4 md:grid-cols-4">
          <Field name="area_m2" label="Površina (m²)" type="number" step="0.01" defaultValue={v('area_m2')} error={e.area_m2} />
          <Field name="bedrooms" label="Spavaće sobe" type="number" defaultValue={v('bedrooms')} error={e.bedrooms} />
          <Field name="bathrooms" label="Kupatila" type="number" defaultValue={v('bathrooms')} error={e.bathrooms} />
          <Field name="max_guests" label="Max. gostiju" type="number" defaultValue={v('max_guests')} error={e.max_guests} hint="za najam" />
        </div>
        <div className="mt-4">
          <Field
            name="features"
            label="Sadržaji"
            defaultValue={state.values?.features ?? property?.features?.join(', ') ?? ''}
            hint="Odvojite zarezom: bazen, garaža, vrt"
            error={e.features}
          />
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="mb-4 font-semibold text-slate-900">Objavljivanje</h2>
        <div className="grid gap-3 md:grid-cols-2">
          <CheckboxField name="is_published" label="Objavljeno" hint="Vidljivo posjetiteljima sajta" defaultChecked={checked('is_published', false)} />
          <CheckboxField name="is_featured" label="Istaknuto" hint="Prikazuje se na naslovnoj strani" defaultChecked={checked('is_featured', true)} />
        </div>
        <div className="mt-4 max-w-xs">
          <Field name="sort_order" label="Redoslijed" type="number" defaultValue={v('sort_order', 0)} hint="Manji broj = ranije" error={e.sort_order} />
        </div>
      </section>

      {/* On a phone the property form is several screens long; keeping Save
          in reach means no scrolling to the bottom to commit a one-word edit.
          It sits above the tab bar, and returns to normal flow on desktop. */}
      <div className="sticky bottom-[76px] z-10 -mx-4 border-t border-slate-200 bg-white/95 px-4 py-3 backdrop-blur-md md:static md:mx-0 md:border-0 md:bg-transparent md:p-0 md:backdrop-blur-none">
        <SubmitButton>{submitLabel ?? 'Sačuvaj'}</SubmitButton>
      </div>
    </form>
  );
}
