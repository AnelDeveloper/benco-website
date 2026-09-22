'use client';

import { useState } from 'react';
import { Check, Loader2 } from 'lucide-react';

export type RequestKind = 'purchase' | 'offplan' | 'investment';

type Labels = {
  title: string;
  subtitle: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  submit: string;
  submitting: string;
  successTitle: string;
  successBody: string;
  error: string;
  amount?: string;
  units?: string;
};

export function RequestForm({
  kind,
  propertyId,
  projectId,
  currency,
  labels,
  accent = 'gold',
}: {
  kind: RequestKind;
  propertyId?: string;
  projectId?: string;
  currency: string;
  labels: Labels;
  accent?: 'gold' | 'slate';
}) {
  const [status, setStatus] = useState<'idle' | 'sending' | 'done'>('idle');
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setStatus('sending');

    const form = new FormData(event.currentTarget);
    const amount = form.get('amount');
    const units = form.get('units');

    const response = await fetch('/api/requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        kind,
        propertyId: propertyId ?? null,
        projectId: projectId ?? null,
        name: form.get('name'),
        email: form.get('email'),
        phone: form.get('phone'),
        message: form.get('message'),
        amount: amount ? Number(amount) : null,
        units: units ? Number(units) : null,
      }),
    });

    if (response.ok) {
      setStatus('done');
      return;
    }

    const data = await response.json().catch(() => ({}));
    setError(data.error ?? labels.error);
    setStatus('idle');
  }

  if (status === 'done') {
    return (
      <div className="rounded-2xl border border-green-200 bg-green-50 p-6 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-600">
          <Check size={24} className="text-white" />
        </div>
        <h3 className="text-lg font-bold text-green-900">{labels.successTitle}</h3>
        <p className="mt-1 text-sm text-green-800">{labels.successBody}</p>
      </div>
    );
  }

  const inputClass =
    'w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 outline-none transition focus:border-gold-500 focus:ring-2 focus:ring-gold-500/25';
  const buttonClass =
    accent === 'gold'
      ? 'bg-gold-600 hover:bg-gold-500'
      : 'bg-slate-900 hover:bg-slate-700';

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-lg">
      <h3 className="text-xl font-bold text-gray-900">{labels.title}</h3>
      <p className="mb-4 mt-1 text-sm text-gray-600">{labels.subtitle}</p>

      {error && (
        <p role="alert" className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor={`${kind}-name`} className="mb-1 block text-sm font-medium text-gray-700">{labels.name}</label>
          <input id={`${kind}-name`} name="name" required className={inputClass} />
        </div>
        <div>
          <label htmlFor={`${kind}-email`} className="mb-1 block text-sm font-medium text-gray-700">{labels.email}</label>
          <input id={`${kind}-email`} name="email" type="email" required className={inputClass} />
        </div>
        <div>
          <label htmlFor={`${kind}-phone`} className="mb-1 block text-sm font-medium text-gray-700">{labels.phone}</label>
          <input id={`${kind}-phone`} name="phone" type="tel" className={inputClass} />
        </div>

        {labels.amount && (
          <div>
            <label htmlFor={`${kind}-amount`} className="mb-1 block text-sm font-medium text-gray-700">
              {labels.amount} ({currency})
            </label>
            <input id={`${kind}-amount`} name="amount" type="number" min={0} step="0.01" className={inputClass} />
          </div>
        )}
        {labels.units && (
          <div>
            <label htmlFor={`${kind}-units`} className="mb-1 block text-sm font-medium text-gray-700">{labels.units}</label>
            <input id={`${kind}-units`} name="units" type="number" min={1} defaultValue={1} className={inputClass} />
          </div>
        )}

        <div className="sm:col-span-2">
          <label htmlFor={`${kind}-message`} className="mb-1 block text-sm font-medium text-gray-700">{labels.message}</label>
          <textarea id={`${kind}-message`} name="message" rows={3} className={inputClass} />
        </div>
      </div>

      <button
        type="submit"
        disabled={status === 'sending'}
        className={`mt-4 flex w-full items-center justify-center gap-2 rounded-lg px-6 py-3 font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60 ${buttonClass}`}
      >
        {status === 'sending' ? (
          <>
            <Loader2 size={18} className="animate-spin" /> {labels.submitting}
          </>
        ) : (
          labels.submit
        )}
      </button>
    </form>
  );
}
