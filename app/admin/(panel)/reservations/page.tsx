import { CalendarDays, Mail, Phone, Users, Ban } from 'lucide-react';
import { requireStaff } from '@/lib/auth/admin';
import { createAdminClient } from '@/lib/supabase/admin';
import { DeleteButton } from '@/components/admin/DeleteButton';
import { BlockDatesForm } from '@/components/admin/BlockDatesForm';
import { cancelReservation } from '@/app/admin/_actions/reservations';
import type { ReservationRow, PropertyRow } from '@/lib/supabase/types';

export const dynamic = 'force-dynamic';

/** `[2026-09-25,2026-09-28)` → `25.09.2026 — 28.09.2026` */
function formatPeriod(period: string): string {
  const match = /^\[(\d{4})-(\d{2})-(\d{2}),(\d{4})-(\d{2})-(\d{2})\)$/.exec(period);
  if (!match) return period;
  const [, y1, m1, d1, y2, m2, d2] = match;
  return `${d1}.${m1}.${y1} — ${d2}.${m2}.${y2}`;
}

export default async function ReservationsPage() {
  await requireStaff();
  const db = createAdminClient();

  const [reservationResult, propertyResult] = await Promise.all([
    db.from('reservations').select('*').order('created_at', { ascending: false }),
    db.from('properties').select('id, title_bs, listing_mode').order('title_bs'),
  ]);

  const reservations = (reservationResult.data ?? []) as ReservationRow[];
  const properties = (propertyResult.data ?? []) as Pick<PropertyRow, 'id' | 'title_bs' | 'listing_mode'>[];
  const titleById = new Map(properties.map((p) => [p.id, p.title_bs]));

  const active = reservations.filter((r) => r.status === 'confirmed');
  const cancelled = reservations.filter((r) => r.status === 'cancelled');
  const rentable = properties.filter((p) => p.listing_mode !== 'sale');

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Rezervacije</h1>
      <p className="mb-6 mt-1 text-slate-600">
        {active.length} aktivnih · {cancelled.length} otkazanih
      </p>

      <div className="mb-8">
        <BlockDatesForm properties={rentable.map((p) => ({ id: p.id, title: p.title_bs }))} />
      </div>

      {active.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-600">
          Još nema rezervacija.
        </div>
      ) : (
        <ul className="space-y-3">
          {active.map((reservation) => (
            <li key={reservation.id} className="rounded-xl border border-slate-200 bg-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-semibold text-slate-900">
                      {titleById.get(reservation.property_id) ?? 'Nekretnina'}
                    </h2>
                    {reservation.kind === 'block' ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
                        <Ban size={11} /> Blokirano
                      </span>
                    ) : (
                      <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">
                        Rezervisano
                      </span>
                    )}
                  </div>

                  <p className="mt-1.5 flex items-center gap-1.5 text-sm font-medium text-slate-700">
                    <CalendarDays size={15} /> {formatPeriod(reservation.period)}
                  </p>

                  {reservation.kind === 'booking' ? (
                    <div className="mt-2 space-y-1 text-sm text-slate-600">
                      <p className="font-medium text-slate-800">{reservation.guest_name}</p>
                      {reservation.guest_email && (
                        <p className="flex items-center gap-1.5">
                          <Mail size={14} />
                          <a href={`mailto:${reservation.guest_email}`} className="hover:text-gold-600">
                            {reservation.guest_email}
                          </a>
                        </p>
                      )}
                      {reservation.guest_phone && (
                        <p className="flex items-center gap-1.5">
                          <Phone size={14} />
                          <a href={`tel:${reservation.guest_phone}`} className="hover:text-gold-600">
                            {reservation.guest_phone}
                          </a>
                        </p>
                      )}
                      <p className="flex items-center gap-1.5"><Users size={14} /> {reservation.guests} gostiju</p>
                      {reservation.message && (
                        <p className="mt-2 rounded-lg bg-slate-50 p-3 text-slate-700">{reservation.message}</p>
                      )}
                    </div>
                  ) : (
                    reservation.reason && <p className="mt-2 text-sm text-slate-600">{reservation.reason}</p>
                  )}
                </div>

                {/* Full width on a phone so Otkaži is an easy target, and
                    back to a right-aligned column from sm upwards. */}
                <div className="flex w-full flex-col items-stretch gap-2 sm:w-auto sm:items-end">
                  {reservation.total_price !== null && (
                    <span className="text-lg font-bold text-slate-900 sm:text-right">
                      {reservation.total_price} BAM
                    </span>
                  )}
                  <DeleteButton
                    action={cancelReservation.bind(null, reservation.id)}
                    label="Otkaži"
                    confirmLabel="Sigurno otkaži"
                  />
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {cancelled.length > 0 && (
        <details className="mt-8">
          <summary className="cursor-pointer text-sm font-medium text-slate-600 hover:text-slate-900">
            Otkazane rezervacije ({cancelled.length})
          </summary>
          <ul className="mt-3 space-y-2">
            {cancelled.map((reservation) => (
              <li key={reservation.id} className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                <span className="line-through">{formatPeriod(reservation.period)}</span>
                {' — '}
                {titleById.get(reservation.property_id) ?? ''} · {reservation.guest_name ?? 'blokirano'}
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
