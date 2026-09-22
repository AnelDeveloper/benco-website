import { localized, type Locale } from '@/lib/localized';
import { createAnonClient } from '@/lib/supabase/anon';
import type { ListingMode, PropertyType } from '@/lib/supabase/types';

const CARD_COLUMNS = `
  id, slug, title_bs, title_en, property_type, listing_mode, location,
  price, price_per_night, currency, area_m2, bedrooms, bathrooms,
  property_images (url, alt_bs, alt_en, sort_order)
`;

export type PropertyCard = {
  id: string;
  slug: string;
  title: string;
  propertyType: PropertyType;
  listingMode: ListingMode;
  location: string;
  price: number | null;
  pricePerNight: number | null;
  currency: string;
  areaM2: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  coverImage: string | null;
  coverAlt: string;
};

type ImageLike = {
  url: string;
  alt_bs: string | null;
  alt_en: string | null;
  sort_order: number;
};

type PropertyCardRow = Record<string, unknown> & {
  id: string;
  slug: string;
  property_type: PropertyType;
  listing_mode: ListingMode;
  location: string;
  price: number | null;
  price_per_night: number | null;
  currency: string;
  area_m2: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  property_images?: ImageLike[] | null;
};

export function toPropertyCard(row: PropertyCardRow, locale: Locale): PropertyCard {
  const images = [...(row.property_images ?? [])].sort((a, b) => a.sort_order - b.sort_order);
  const cover = images[0] ?? null;
  const title = localized(row, 'title', locale);

  return {
    id: row.id,
    slug: row.slug,
    title,
    propertyType: row.property_type,
    listingMode: row.listing_mode,
    location: row.location,
    price: row.price,
    pricePerNight: row.price_per_night,
    currency: row.currency,
    areaM2: row.area_m2,
    bedrooms: row.bedrooms,
    bathrooms: row.bathrooms,
    coverImage: cover?.url ?? null,
    coverAlt: cover ? localized(cover, 'alt', locale) || title : title,
  };
}

/**
 * Featured, published properties for the homepage.
 *
 * Never throws: a missing configuration or a failed query yields an empty list
 * so the page still renders and the build still succeeds.
 */
export async function getFeaturedProperties(
  locale: Locale,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  client: any = createAnonClient(),
): Promise<PropertyCard[]> {
  if (!client) return [];

  const { data, error } = await client
    .from('properties')
    .select(CARD_COLUMNS)
    .eq('is_published', true)
    .eq('is_featured', true)
    .order('sort_order', { ascending: true })
    .limit(6);

  if (error || !data) {
    if (error) console.error('getFeaturedProperties failed:', error);
    return [];
  }

  return (data as PropertyCardRow[]).map((row) => toPropertyCard(row, locale));
}
