'use client';

import { useActionState } from 'react';
import { Ban } from 'lucide-react';
import { blockDates, type BlockState } from '@/app/admin/_actions/reservations';
import { SubmitButton } from './Fields';

export function BlockDatesForm({ properties }: { properties: { id: string; title: string }[] }) {
  const [state, formAction] = useActionState<BlockState, FormData>(blockDates, {
    error: null,
    message: null,
  });

  if (properties.length === 0) return null;

  const inputClass = 'rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900';

  return (
    <form action={formAction} className="rounded-xl border border-slate-200 bg-white p-5">
      <h2 className="flex items-center gap-2 font-semibold text-slate-900">
        <Ban size={17} className="text-slate-500" /> Blokiraj termin
      </h2>
      <p className="mb-4 mt-1 text-sm text-slate-500">
        Za lični boravak ili radove — blokirani datumi se ne mogu rezervisati.
      </p>

      {state.error && <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>}
      {state.message && <p className="mb-3 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">{state.message}</p>}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <select name="property_id" required className={`${inputClass} lg:col-span-2`}>
          {properties.map((property) => (
            <option key={property.id} value={property.id}>{property.title}</option>
          ))}
        </select>
        <input name="from" type="date" required aria-label="Od" className={inputClass} />
        <input name="to" type="date" required aria-label="Do" className={inputClass} />
        <input name="reason" placeholder="Razlog (opcionalno)" className={inputClass} />
      </div>

      <div className="mt-3">
        <SubmitButton>Blokiraj</SubmitButton>
      </div>
    </form>
  );
}
