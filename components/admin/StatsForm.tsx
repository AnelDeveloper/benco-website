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
  });

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
        <Field name="projects_completed" label="Završenih projekata" type="number" min={0} defaultValue={stats.projects_completed} />
        <Field name="sqm_delivered" label="Izgrađeno m²" type="number" min={0} defaultValue={stats.sqm_delivered} />
        <Field name="investors_count" label="Broj investitora" type="number" min={0} defaultValue={stats.investors_count} />
        <Field name="years_experience" label="Godina iskustva" type="number" min={0} defaultValue={stats.years_experience} />
      </div>

      <SubmitButton />
    </form>
  );
}
