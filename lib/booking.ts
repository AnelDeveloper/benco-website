export const MAX_NIGHTS = 30;
export const MAX_DAYS_AHEAD = 365;

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Parses YYYY-MM-DD as UTC midnight, so no timezone can shift the day. */
function parseDate(value: string): Date | null {
  if (!ISO_DATE.test(value)) return null;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function toISODate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Postgres daterange literal, half-open.
 *
 * `[in, out)` means the checkout day is not occupied, so a guest leaving on the
 * 10th does not block one arriving on the 10th — which is how nights work.
 */
export function toDateRange(checkIn: string, checkOut: string): string {
  return `[${checkIn},${checkOut})`;
}

export function nightsBetween(checkIn: string, checkOut: string): number {
  const from = parseDate(checkIn);
  const to = parseDate(checkOut);
  if (!from || !to) return 0;
  return Math.round((to.getTime() - from.getTime()) / MS_PER_DAY);
}

export type StayValidation = { ok: true; nights: number } | { ok: false; error: string };

export function validateStay(
  checkIn: string,
  checkOut: string,
  now: Date = new Date(),
): StayValidation {
  const from = parseDate(checkIn);
  const to = parseDate(checkOut);

  if (!from || !to) return { ok: false, error: 'Odaberite ispravne datume.' };

  const today = new Date(`${toISODate(now)}T00:00:00Z`);
  if (from.getTime() < today.getTime()) {
    return { ok: false, error: 'Datum dolaska ne može biti u prošlosti.' };
  }

  const nights = Math.round((to.getTime() - from.getTime()) / MS_PER_DAY);
  if (nights < 1) return { ok: false, error: 'Odlazak mora biti nakon dolaska.' };
  if (nights > MAX_NIGHTS) {
    return { ok: false, error: `Najduži boravak je ${MAX_NIGHTS} noći. Kontaktirajte nas za duži period.` };
  }

  const daysAhead = Math.round((from.getTime() - today.getTime()) / MS_PER_DAY);
  if (daysAhead > MAX_DAYS_AHEAD) {
    return { ok: false, error: 'Rezervacije su moguće do godinu dana unaprijed.' };
  }

  return { ok: true, nights };
}

export function totalPrice(pricePerNight: number | null, nights: number): number | null {
  if (pricePerNight === null) return null;
  return Math.round(pricePerNight * nights * 100) / 100;
}

export type OccupiedRange = { from: string; to: string };

/**
 * Converts stored half-open ranges into the inclusive nights a calendar should
 * disable. `[10-01,10-04)` occupies the 1st, 2nd and 3rd — not the 4th.
 */
export function parseAvailability(rows: { period: string }[]): OccupiedRange[] {
  const ranges: OccupiedRange[] = [];

  for (const row of rows) {
    const match = /^\[(\d{4}-\d{2}-\d{2}),(\d{4}-\d{2}-\d{2})\)$/.exec(row.period ?? '');
    if (!match) continue;

    const end = parseDate(match[2]);
    if (!end) continue;

    const lastNight = new Date(end.getTime() - MS_PER_DAY);
    ranges.push({ from: match[1], to: toISODate(lastNight) });
  }

  return ranges;
}
