'use client';

import { useActionState } from 'react';
import { Field, SubmitButton } from './Fields';
import { updateStats, type StatsState } from '@/app/admin/_actions/stats';

export function StatsForm({
  stats,
}: {
  stats: {
    projects_completed: number;
    sqm_delivered: number;
    investors_count: number;
    years_experience: number;
  };
}) {
  const [state, formAction] = useActionState<StatsState, FormData>(updateStats, {
    message: null,
    error: false,
    values: null,
  });

  /** Prefer what the action just confirmed, then the value the page loaded with. */
  const v = (name: keyof typeof stats) => state.values?.[name] ?? stats[name];

  return (
    <form action={formAction} className="space-y-4 rounded-xl border border-slate-200 bg-white p-5">
      {state.message && (
        <p
          className={`rounded-lg px-3 py-2 text-sm ${
            state.error ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'
          }`}
        >
          {state.message}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field name="projects_completed" label="Završenih projekata" type="number" min={0} defaultValue={v('projects_completed')} />
        <Field name="sqm_delivered" label="Izgrađeno m²" type="number" min={0} defaultValue={v('sqm_delivered')} />
        <Field name="investors_count" label="Broj investitora" type="number" min={0} defaultValue={v('investors_count')} />
        <Field name="years_experience" label="Godina iskustva" type="number" min={0} defaultValue={v('years_experience')} />
      </div>

      <SubmitButton />
    </form>
  );
}
