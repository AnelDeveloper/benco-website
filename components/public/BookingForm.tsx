'use client';

import { useEffect, useMemo, useState } from 'react';
import { DayPicker, type DateRange } from 'react-day-picker';
import { bs, enUS } from 'react-day-picker/locale';
import { CalendarDays, Check, Loader2 } from 'lucide-react';
import 'react-day-picker/style.css';

type Labels = {
  title: string;
  subtitle: string;
  name: string;
  email: string;
  phone: string;
  guests: string;
  message: string;
  submit: string;
  submitting: string;
  nights: string;
  total: string;
  pickDates: string;
  successTitle: string;
  successBody: string;
  perNight: string;
};

function toISO(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function fromISO(value: string): Date {
  const [y, m, d] = value.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function BookingForm({
  propertyId,
  pricePerNight,
  currency,
  maxGuests,
  locale,
  labels,
}: {
  propertyId: string;
  pricePerNight: number | null;
  currency: string;
  maxGuests: number | null;
  locale: 'bs' | 'en';
  labels: Labels;
}) {
  const [range, setRange] = useState<DateRange | undefined>();
  const [occupied, setOccupied] = useState<{ from: Date; to: Date }[]>([]);
  const [status, setStatus] = useState<'idle' | 'sending' | 'done'>('idle');
  const [error, setError] = useState<string | null>(null);

  async function loadAvailability() {
    try {
      const response = await fetch(`/api/availability/${propertyId}`, { cache: 'no-store' });
      const data = await response.json();
      setOccupied(
        (data.occupied ?? []).map((r: { from: string; to: string }) => ({
          from: fromISO(r.from),
          to: fromISO(r.to),
        })),
      );
    } catch {
      // A failed availability fetch must not block the form; the database
      // constraint still refuses a genuinely double booking on submit.
      setOccupied([]);
    }
  }

  useEffect(() => {
    loadAvailability();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [propertyId]);

  const nights = useMemo(() => {
    if (!range?.from || !range?.to) return 0;
    return Math.round((range.to.getTime() - range.from.getTime()) / 86400000);
  }, [range]);

  const total = pricePerNight !== null && nights > 0 ? Math.round(pricePerNight * nights * 100) / 100 : null;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!range?.from || !range?.to || nights < 1) {
      setError(labels.pickDates);
      return;
    }

    const formData = new FormData(event.currentTarget);
    setStatus('sending');

    const response = await fetch('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        propertyId,
        checkIn: toISO(range.from),
        checkOut: toISO(range.to),
        name: formData.get('name'),
        email: formData.get('email'),
        phone: formData.get('phone'),
        guests: Number(formData.get('guests') ?? 1),
        message: formData.get('message'),
      }),
    });

    if (response.ok) {
      setStatus('done');
      return;
    }

    const data = await response.json().catch(() => ({}));
    setError(data.error ?? 'Greška. Pokušajte ponovo.');
    setStatus('idle');

    // 409 means someone booked these dates first — refresh so the calendar
    // shows the truth rather than offering them again.
    if (response.status === 409) {
      setRange(undefined);
      loadAvailability();
    }
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

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-lg">
      <div className="mb-4 flex items-baseline justify-between gap-3">
        <h3 className="text-xl font-bold text-gray-900">{labels.title}</h3>
        {pricePerNight !== null && (
          <span className="text-sm text-gray-600">
            <strong className="text-lg text-gray-900">{pricePerNight}</strong> {currency} {labels.perNight}
          </span>
        )}
      </div>
      <p className="mb-4 text-sm text-gray-600">{labels.subtitle}</p>

      <div className="mb-4 overflow-x-auto rounded-xl border border-gray-200 p-2">
        <DayPicker
          mode="range"
          selected={range}
          onSelect={setRange}
          disabled={[{ before: new Date() }, ...occupied]}
          numberOfMonths={1}
          locale={locale === 'bs' ? bs : enUS}
          className="mx-auto [--rdp-accent-color:#d97706] [--rdp-accent-background-color:#fef3c7]"
        />
      </div>

      {nights > 0 && (
        <div className="mb-4 flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3 text-sm">
          <span className="flex items-center gap-2 text-gray-700">
            <CalendarDays size={16} /> {nights} {labels.nights}
          </span>
          {total !== null && (
            <span className="font-bold text-gray-900">
              {labels.total}: {total} {currency}
            </span>
          )}
        </div>
      )}

      {error && (
        <p role="alert" className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor="name" className="mb-1 block text-sm font-medium text-gray-700">{labels.name}</label>
          <input id="name" name="name" required className={inputClass} />
        </div>
        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium text-gray-700">{labels.email}</label>
          <input id="email" name="email" type="email" required className={inputClass} />
        </div>
        <div>
          <label htmlFor="phone" className="mb-1 block text-sm font-medium text-gray-700">{labels.phone}</label>
          <input id="phone" name="phone" type="tel" className={inputClass} />
        </div>
        <div>
          <label htmlFor="guests" className="mb-1 block text-sm font-medium text-gray-700">{labels.guests}</label>
          <input
            id="guests"
            name="guests"
            type="number"
            min={1}
            max={maxGuests ?? 20}
            defaultValue={2}
            className={inputClass}
          />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="message" className="mb-1 block text-sm font-medium text-gray-700">{labels.message}</label>
          <textarea id="message" name="message" rows={3} className={inputClass} />
        </div>
      </div>

      <button
        type="submit"
        disabled={status === 'sending'}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-gold-600 px-6 py-3 font-semibold text-white transition hover:bg-gold-500 disabled:cursor-not-allowed disabled:opacity-60"
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
