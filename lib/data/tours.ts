import { localized, type Locale } from '@/lib/localized';
import { createAnonClient } from '@/lib/supabase/anon';

export type TourCard = {
  id: string;
  slug: string;
  title: string;
  blurb: string;
  durationHours: number | null;
  distanceKm: number | null;
  pricePerPerson: number | null;
  currency: string;
  coverUrl: string | null;
  maxSeats: number;
};

const COLUMNS = `
  id, slug, title_bs, title_en, blurb_bs, blurb_en,
  duration_hours, distance_km, price_per_person, currency, cover_url, max_seats
`;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toCard(row: any, locale: Locale): TourCard {
  return {
    id: row.id,
    slug: row.slug,
    title: localized(row, 'title', locale),
    blurb: localized(row, 'blurb', locale),
    durationHours: row.duration_hours,
    distanceKm: row.distance_km,
    pricePerPerson: row.price_per_person,
    currency: row.currency,
    coverUrl: row.cover_url,
    maxSeats: row.max_seats,
  };
}

export async function getPublishedTours(
  locale: Locale,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  client: any = createAnonClient(),
): Promise<TourCard[]> {
  if (!client) return [];

  const { data, error } = await client
    .from('tours')
    .select(COLUMNS)
    .eq('is_published', true)
    .order('sort_order', { ascending: true });

  if (error || !data) {
    if (error) console.error('getPublishedTours failed:', error);
    return [];
  }
  return data.map((row: unknown) => toCard(row, locale));
}
