'use client';

import { useActionState } from 'react';
import { Field, TextareaField, CheckboxField, SubmitButton } from './Fields';
import type { FormState } from '@/app/admin/_actions/properties';
import type { TourRow } from '@/lib/supabase/types';

export function TourForm({
  action,
  tour,
  submitLabel,
}: {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  tour?: TourRow;
  submitLabel?: string;
}) {
  const [state, formAction] = useActionState<FormState, FormData>(action, {
    errors: {},
    message: null,
    values: null,
  });
  const e = state.errors;

  const v = (name: keyof TourRow, fallback?: string | number | null) =>
    state.values?.[name] ?? fallback ?? (tour?.[name] as string | number | null | undefined) ?? '';

  const checked = (name: 'is_published', fallback: boolean) =>
    state.values ? state.values[name] === 'on' : (tour?.[name] ?? fallback);

  return (
    <form action={formAction} className="space-y-6">
      {state.message && (
        <p
          className={`rounded-lg px-3 py-2 text-sm ${
            Object.keys(e).length > 0 ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'
          }`}
        >
          {state.message}
        </p>
      )}

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="mb-4 font-semibold text-slate-900">Osnovni podaci</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Field name="title_bs" label="Naziv (BS)" required defaultValue={v('title_bs')} error={e.title_bs} />
          <Field name="title_en" label="Naziv (EN)" required defaultValue={v('title_en')} error={e.title_en} />
          <TextareaField name="blurb_bs" label="Kratki opis (BS)" defaultValue={String(v('blurb_bs'))} error={e.blurb_bs} />
          <TextareaField name="blurb_en" label="Kratki opis (EN)" defaultValue={String(v('blurb_en'))} error={e.blurb_en} />
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="mb-4 font-semibold text-slate-900">Detalji ture</h2>
        <div className="grid gap-4 md:grid-cols-4">
          <Field name="duration_hours" label="Trajanje (h)" type="number" step="0.5" defaultValue={v('duration_hours')} error={e.duration_hours} />
          <Field name="distance_km" label="Udaljenost (km)" type="number" defaultValue={v('distance_km')} error={e.distance_km} />
          <Field name="price_per_person" label="Cijena po osobi" type="number" step="0.01" defaultValue={v('price_per_person')} error={e.price_per_person} />
          <Field name="max_seats" label="Max. mjesta" type="number" min={1} max={12} defaultValue={v('max_seats', 6)} error={e.max_seats} />
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <Field name="currency" label="Valuta" defaultValue={v('currency', 'BAM')} error={e.currency} />
          <Field
            name="cover_url"
            label="Slika (putanja)"
            defaultValue={String(v('cover_url'))}
            hint="npr. /images/properties/Vila sa jezerom 2.avif"
            error={e.cover_url}
          />
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="mb-4 font-semibold text-slate-900">Objavljivanje</h2>
        <CheckboxField name="is_published" label="Objavljeno" hint="Vidljivo na sajtu" defaultChecked={checked('is_published', false)} />
        <div className="mt-4 max-w-xs">
          <Field name="sort_order" label="Redoslijed" type="number" defaultValue={v('sort_order', 0)} error={e.sort_order} />
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
