'use client';

import { useActionState, useState } from 'react';
import { Field, TextareaField, SelectField, CheckboxField, SubmitButton } from './Fields';
import type { FormState } from '@/app/admin/_actions/properties';
import type { ProjectRow } from '@/lib/supabase/types';

const STATUSES = [
  { value: 'planning', label: 'U pripremi' },
  { value: 'under_construction', label: 'U izgradnji' },
  { value: 'completed', label: 'Završeno' },
];

export function ProjectForm({
  action,
  project,
  submitLabel,
}: {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  project?: ProjectRow;
  submitLabel?: string;
}) {
  const [state, formAction] = useActionState<FormState, FormData>(action, {
    errors: {},
    message: null,
    values: null,
  });
  const e = state.errors;

  const v = (name: keyof ProjectRow, fallback?: string | number | null) =>
    state.values?.[name] ?? fallback ?? (project?.[name] as string | number | null | undefined) ?? '';

  const checked = (name: 'offers_offplan' | 'offers_investment' | 'is_published', fallback: boolean) =>
    state.values ? state.values[name] === 'on' : (project?.[name] ?? fallback);

  const [progress, setProgress] = useState<number>(
    Number(state.values?.progress_percent ?? project?.progress_percent ?? 0),
  );

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
          <TextareaField name="description_bs" label="Opis (BS)" defaultValue={String(v('description_bs'))} error={e.description_bs} />
          <TextareaField name="description_en" label="Opis (EN)" defaultValue={String(v('description_en'))} error={e.description_en} />
          <Field name="location" label="Lokacija" required defaultValue={v('location')} error={e.location} />
          <SelectField name="status" label="Status" required options={STATUSES} defaultValue={String(v('status', 'planning'))} error={e.status} />
        </div>

        <div className="mt-4">
          <label htmlFor="progress_percent" className="mb-1 block text-sm font-medium text-slate-700">
            Napredak izgradnje: <span className="font-bold text-gold-600">{progress}%</span>
          </label>
          <input
            id="progress_percent"
            name="progress_percent"
            type="range"
            min={0}
            max={100}
            value={progress}
            onChange={(event) => setProgress(Number(event.target.value))}
            className="w-full accent-gold-600"
          />
          <p className="text-xs text-slate-500">Pokreće animaciju izgradnje na sajtu.</p>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <Field name="start_date" label="Početak" type="date" defaultValue={String(v('start_date'))} error={e.start_date} />
          <Field name="expected_completion" label="Očekivani završetak" type="date" defaultValue={String(v('expected_completion'))} error={e.expected_completion} />
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="mb-1 font-semibold text-slate-900">Kupovina u izgradnji</h2>
        <p className="mb-4 text-sm text-slate-500">Za kupce koji kupuju stan prije završetka.</p>
        <div className="grid gap-4 md:grid-cols-3">
          <Field name="total_units" label="Ukupno stanova" type="number" defaultValue={v('total_units')} error={e.total_units} />
          <Field name="available_units" label="Dostupno stanova" type="number" defaultValue={v('available_units')} error={e.available_units} />
          <Field name="price_per_m2" label="Cijena po m²" type="number" step="0.01" defaultValue={v('price_per_m2')} error={e.price_per_m2} />
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="mb-1 font-semibold text-slate-900">Ulaganje</h2>
        <p className="mb-4 text-sm text-slate-500">Za investitore koji ulažu novac uz povrat.</p>
        <div className="grid gap-4 md:grid-cols-4">
          <Field name="min_investment" label="Min. ulaganje" type="number" step="0.01" defaultValue={v('min_investment')} error={e.min_investment} />
          <Field name="expected_return_percent" label="Očekivani povrat (%)" type="number" step="0.01" defaultValue={v('expected_return_percent')} error={e.expected_return_percent} />
          <Field name="funding_goal" label="Cilj prikupljanja" type="number" step="0.01" defaultValue={v('funding_goal')} error={e.funding_goal} />
          <Field name="funded_amount" label="Prikupljeno" type="number" step="0.01" defaultValue={v('funded_amount', 0)} error={e.funded_amount} />
        </div>
        <div className="mt-4">
          <Field name="currency" label="Valuta" defaultValue={v('currency', 'BAM')} error={e.currency} />
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="mb-4 font-semibold text-slate-900">Ponuda i objava</h2>
        <div className="grid gap-3 md:grid-cols-3">
          <CheckboxField name="offers_offplan" label="Kupovina u izgradnji" hint="Prikaži dugme za kupovinu" defaultChecked={checked('offers_offplan', true)} />
          <CheckboxField name="offers_investment" label="Ulaganje" hint="Prikaži dugme za investiranje" defaultChecked={checked('offers_investment', true)} />
          <CheckboxField name="is_published" label="Objavljeno" hint="Vidljivo na sajtu" defaultChecked={checked('is_published', false)} />
        </div>
        <div className="mt-4 max-w-xs">
          <Field name="sort_order" label="Redoslijed" type="number" defaultValue={v('sort_order', 0)} error={e.sort_order} />
        </div>
      </section>

      <SubmitButton>{submitLabel ?? 'Sačuvaj'}</SubmitButton>
    </form>
  );
}
