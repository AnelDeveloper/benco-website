'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { X, Check, Minus, Plus, Loader2 } from 'lucide-react';
import { useDrawer, type DrawerKind } from './DrawerContext';
import { Calendar, toISO, type Occupied } from './Calendar';
import { formatNumber } from '@/lib/format';

const NEEDS_CALENDAR: DrawerKind[] = ['stay', 'tour'];

function nightsBetween(from: string, to: string): number {
  return Math.round(
    (new Date(`${to}T00:00:00`).getTime() - new Date(`${from}T00:00:00`).getTime()) / 86400000,
  );
}

function Stepper({
  value,
  onChange,
  max,
  label,
}: {
  value: number;
  onChange: (next: number) => void;
  max: number;
  label: string;
}) {
  return (
    <div>
      <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">{label}</span>
      <div className="flex h-[46px] items-center justify-between rounded-xl bg-paper-3 px-3">
        <button
          type="button"
          aria-label="−"
          onClick={() => onChange(Math.max(1, value - 1))}
          className="flex h-7 w-7 items-center justify-center rounded-lg bg-white text-ink-2 shadow-sm disabled:opacity-40"
          disabled={value <= 1}
        >
          <Minus size={14} />
        </button>
        <span className="text-[15px] font-semibold text-ink-2">{value}</span>
        <button
          type="button"
          aria-label="+"
          onClick={() => onChange(Math.min(max, value + 1))}
          className="flex h-7 w-7 items-center justify-center rounded-lg bg-white text-ink-2 shadow-sm disabled:opacity-40"
          disabled={value >= max}
        >
          <Plus size={14} />
        </button>
      </div>
    </div>
  );
}

const fieldClass =
  'h-12 w-full rounded-xl bg-paper-3 px-3.5 text-[15px] text-ink-2 outline-none transition focus:ring-2 focus:ring-gold-accent/40';

export function BookingDrawer() {
  const { state, close } = useDrawer();
  const t = useTranslations('landing.drawer');
  const locale = useLocale();

  const [month, setMonth] = useState(() => new Date());
  const [from, setFrom] = useState<string | null>(null);
  const [to, setTo] = useState<string | null>(null);
  const [count, setCount] = useState(2);
  const [amount, setAmount] = useState('');
  const [size, setSize] = useState('55');
  const [occupied, setOccupied] = useState<Occupied[]>([]);
  const [status, setStatus] = useState<'idle' | 'sending' | 'done'>('idle');
  const [error, setError] = useState<string | null>(null);

  const kind = state?.kind;
  const item = state?.item;

  // Reset per opening, and preload availability for a stay.
  useEffect(() => {
    if (!state) return;
    setFrom(null); setTo(null); setError(null); setStatus('idle');
    setCount(state.kind === 'tour' ? 2 : 2);
    setAmount(
      state.kind === 'invest' ? String(state.item.minInvestment ?? 20000)
        : state.kind === 'offer' ? String(state.item.price ?? '')
          : '',
    );
    setSize('55');
    setMonth(new Date());
    setOccupied([]);

    if (state.kind === 'stay') {
      fetch(`/api/availability/${state.item.id}`, { cache: 'no-store' })
        .then((r) => r.json())
        .then((d) => setOccupied(d.occupied ?? []))
        .catch(() => setOccupied([]));
    }
  }, [state]);

  // Escape closes; body scroll locks while open.
  useEffect(() => {
    if (!state) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') close(); };
    document.addEventListener('keydown', onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previous;
    };
  }, [state, close]);

  if (!state || !item || !kind) return null;

  const nights = from && to ? nightsBetween(from, to) : 0;
  const perNight = item.pricePerNight ?? 0;
  const stayTotal = nights * perNight;
  const tourTotal = (item.pricePerPerson ?? 0) * count;
  const offplanTotal = Number(size || 0) * (item.pricePerM2 ?? 0);
  const investReturn = (Number(amount || 0) * (item.expectedReturnPercent ?? 0)) / 100;

  const kickerKey = {
    stay: 'stayKicker', offer: 'offerKicker', offplan: 'offplanKicker',
    invest: 'investKicker', tour: 'tourKicker',
  }[kind] as 'stayKicker';

  function pickDate(iso: string) {
    if (kind === 'tour') { setFrom(iso); setTo(iso); return; }
    if (!from || (from && to)) { setFrom(iso); setTo(null); return; }
    if (iso <= from) { setFrom(iso); return; }
    setTo(iso);
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (kind === 'stay' && (!from || !to || nights < 1)) { setError(t('pickDates')); return; }
    if (kind === 'tour' && !from) { setError(t('pickDate')); return; }

    const form = new FormData(event.currentTarget);
    const contact = {
      name: form.get('name'),
      email: form.get('email'),
      phone: form.get('phone'),
    };

    setStatus('sending');

    const [url, body] =
      kind === 'stay'
        ? ['/api/bookings', { propertyId: item!.id, checkIn: from, checkOut: to, guests: count, ...contact }]
        : kind === 'tour'
          ? ['/api/requests', { kind: 'tour', tourId: item!.id, tourDate: from, seats: count, ...contact }]
          : kind === 'offer'
            ? ['/api/requests', { kind: 'purchase', propertyId: item!.id, amount: Number(amount) || null, ...contact }]
            : kind === 'offplan'
              ? ['/api/requests', { kind: 'offplan', projectId: item!.id, units: 1, amount: offplanTotal || null, message: `${size} m²`, ...contact }]
              : ['/api/requests', { kind: 'investment', projectId: item!.id, amount: Number(amount) || null, ...contact }];

    const response = await fetch(url as string, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (response.ok) { setStatus('done'); return; }

    const data = await response.json().catch(() => ({}));
    setError(data.error ?? 'Greška. Pokušajte ponovo.');
    setStatus('idle');

    // Someone took these dates first — show the truth, don't offer them again.
    if (response.status === 409 && kind === 'stay') {
      setFrom(null); setTo(null);
      fetch(`/api/availability/${item!.id}`, { cache: 'no-store' })
        .then((r) => r.json())
        .then((d) => setOccupied(d.occupied ?? []))
        .catch(() => undefined);
    }
  }

  const monthLabel = new Intl.DateTimeFormat(locale === 'bs' ? 'bs-BA' : 'en-GB', {
    month: 'long',
    year: 'numeric',
  }).format(month);

  return (
    <>
      <div
        onClick={close}
        className="fixed inset-0 z-[80] bg-[rgba(11,18,32,.55)] backdrop-blur-[4px]"
        aria-hidden
      />
      <aside
        role="dialog"
        aria-modal="true"
        className="fixed inset-y-0 right-0 z-[90] w-[min(460px,100%)] overflow-y-auto bg-white shadow-drawer"
        style={{ animation: 'drawerIn .45s cubic-bezier(.2,.7,.2,1) both' }}
      >
        <style>{`@keyframes drawerIn{from{transform:translateX(105%)}to{transform:none}}`}</style>

        <header className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-line-3 bg-white px-6 py-5">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gold-text">{t(kickerKey)}</p>
            <h2 className="mt-1 text-xl font-semibold text-ink-2">{item.title}</h2>
          </div>
          <button
            type="button"
            onClick={close}
            aria-label={t('close')}
            className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-full border border-line-2 text-ink-2 transition hover:bg-paper-3"
          >
            <X size={17} />
          </button>
        </header>

        {status === 'done' ? (
          <div className="px-6 py-14 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#e8f7ee]">
              <Check size={30} className="text-[#16a34a]" />
            </div>
            <h3 className="font-display text-[32px] text-ink-2">
              {kind === 'stay' ? t('successStay') : kind === 'tour' ? t('successTour') : t('successRequest')}
            </h3>
            <p className="mx-auto mt-2 max-w-[320px] text-[15px] text-muted-body">
              {kind === 'stay' ? t('successStayBody') : t('successRequestBody')}
            </p>
            <button
              type="button"
              onClick={close}
              className="mt-6 h-12 rounded-xl bg-ink-2 px-8 font-semibold text-white transition hover:bg-gold-deep"
            >
              {t('done')}
            </button>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-5 px-6 py-6">
            <div className="flex items-center gap-3 rounded-xl bg-paper-3 p-3">
              {item.image && (
                <div className="relative h-14 w-[72px] shrink-0 overflow-hidden rounded-lg">
                  <Image src={item.image} alt="" fill className="object-cover" sizes="72px" />
                </div>
              )}
              <div className="min-w-0">
                <p className="truncate text-[15px] font-semibold text-ink-2">{item.title}</p>
                <p className="truncate text-[13px] text-muted">{item.subtitle}</p>
              </div>
            </div>

            {NEEDS_CALENDAR.includes(kind) && (
              <Calendar
                mode={kind === 'tour' ? 'single' : 'range'}
                month={month}
                onMonthChange={setMonth}
                from={from}
                to={to}
                onPick={pickDate}
                occupied={occupied}
                monthLabel={monthLabel}
              />
            )}

            {error && (
              <p role="alert" className="rounded-xl bg-red-50 px-3.5 py-2.5 text-sm text-red-700">{error}</p>
            )}

            <div className="grid gap-3">
              <input name="name" required placeholder={t('name')} className={fieldClass} />
              <input name="email" type="email" required placeholder={t('email')} className={fieldClass} />
              <input name="phone" type="tel" placeholder={t('phone')} className={fieldClass} />
            </div>

            {kind === 'stay' && (
              <Stepper value={count} onChange={setCount} max={item.maxGuests ?? 12} label={t('guests')} />
            )}
            {kind === 'tour' && <Stepper value={count} onChange={setCount} max={6} label={t('seats')} />}

            {kind === 'offer' && (
              <label className="block">
                <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
                  {t('yourOffer')} ({item.currency})
                </span>
                <input
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  type="number"
                  min={0}
                  className={fieldClass}
                />
              </label>
            )}

            {kind === 'offplan' && (
              <label className="block">
                <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
                  {t('sizeM2')}
                </span>
                <input value={size} onChange={(e) => setSize(e.target.value)} type="number" min={20} className={fieldClass} />
              </label>
            )}

            {kind === 'invest' && (
              <label className="block">
                <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
                  {t('investAmount')} ({item.currency})
                </span>
                <input
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  type="number"
                  min={item.minInvestment ?? 0}
                  className={fieldClass}
                />
              </label>
            )}

            <div className="rounded-xl border border-line-3 p-4 text-[15px]">
              {kind === 'stay' && nights > 0 && (
                <Row left={`${nights} × ${formatNumber(perNight)} ${item.currency}`} right={`${formatNumber(stayTotal)} ${item.currency}`} label={t('total')} />
              )}
              {kind === 'tour' && (
                <Row left={`${count} × ${formatNumber(item.pricePerPerson ?? 0)} ${item.currency}`} right={`${formatNumber(tourTotal)} ${item.currency}`} label={t('total')} />
              )}
              {kind === 'offer' && item.price !== null && item.price !== undefined && (
                <Row left={t('listedPrice')} right={`${formatNumber(item.price)} ${item.currency}`} label="" />
              )}
              {kind === 'offplan' && (
                <Row left={`${size} m² × ${formatNumber(item.pricePerM2 ?? 0)}`} right={`${formatNumber(offplanTotal)} ${item.currency}`} label={t('estimatedPrice')} />
              )}
              {kind === 'invest' && (
                <Row left={`${item.expectedReturnPercent ?? 0}%`} right={`${formatNumber(Math.round(investReturn))} ${item.currency}`} label={t('expectedReturnOf')} />
              )}
            </div>

            <button
              type="submit"
              disabled={status === 'sending'}
              className="flex h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-gold-accent text-[15px] font-semibold text-[#1a1200] transition hover:bg-gold-hover disabled:opacity-60"
            >
              {status === 'sending' ? <Loader2 size={18} className="animate-spin" /> : null}
              {kind === 'stay' ? t('bookNow')
                : kind === 'tour' ? t('bookTour')
                  : kind === 'offer' ? t('sendOffer')
                    : kind === 'offplan' ? t('reserveUnit')
                      : t('sendInvestment')}
            </button>

            {(kind === 'stay' || kind === 'tour') && (
              <p className="text-[13px] leading-relaxed text-muted">
                {kind === 'stay' ? t('stayNote') : t('tourNote')}
              </p>
            )}
          </form>
        )}
      </aside>
    </>
  );
}

function Row({ left, right, label }: { left: string; right: string; label: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="text-muted-body">{label || left}</span>
      <span className="font-semibold text-ink-2">{right}</span>
    </div>
  );
}
