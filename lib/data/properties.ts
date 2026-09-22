import { localized, type Locale } from '@/lib/localized';
import { createAnonClient } from '@/lib/supabase/anon';
import type { ListingMode, PropertyType } from '@/lib/supabase/types';

const CARD_COLUMNS = `
  id, slug, title_bs, title_en, property_type, listing_mode, location,
  price, price_per_night, currency, area_m2, bedrooms, bathrooms, max_guests,
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
  maxGuests: number | null;
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
  max_guests?: number | null;
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
    maxGuests: row.max_guests ?? null,
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

export type PropertyDetail = PropertyCard & {
  description: string;
  address: string | null;
  features: string[];
  images: { url: string; alt: string }[];
};

const DETAIL_COLUMNS = `
  id, slug, title_bs, title_en, description_bs, description_en,
  property_type, listing_mode, location, address,
  price, price_per_night, currency, area_m2, bedrooms, bathrooms, max_guests,
  features, property_images (url, alt_bs, alt_en, sort_order)
`;

export type PropertyFilters = {
  type?: string;
  mode?: string;
  location?: string;
};

/** All published properties, optionally filtered. Never throws. */
export async function getPublishedProperties(
  locale: Locale,
  filters: PropertyFilters = {},
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  client: any = createAnonClient(),
): Promise<PropertyCard[]> {
  if (!client) return [];

  let query = client
    .from('properties')
    .select(CARD_COLUMNS)
    .eq('is_published', true)
    .order('sort_order', { ascending: true });

  if (filters.type) query = query.eq('property_type', filters.type);
  if (filters.location) query = query.eq('location', filters.location);
  if (filters.mode === 'rent') query = query.in('listing_mode', ['rent', 'both']);
  if (filters.mode === 'sale') query = query.in('listing_mode', ['sale', 'both']);

  const { data, error } = await query;

  if (error || !data) {
    if (error) console.error('getPublishedProperties failed:', error);
    return [];
  }

  return (data as PropertyCardRow[]).map((row) => toPropertyCard(row, locale));
}

export async function getPropertyBySlug(
  slug: string,
  locale: Locale,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  client: any = createAnonClient(),
): Promise<PropertyDetail | null> {
  if (!client) return null;

  const { data, error } = await client
    .from('properties')
    .select(DETAIL_COLUMNS)
    .eq('slug', slug)
    .eq('is_published', true)
    .maybeSingle();

  if (error || !data) return null;

  const row = data as PropertyCardRow & {
    address: string | null;
    features: string[] | null;
    max_guests: number | null;
  };
  const card = toPropertyCard(row, locale);
  const images = [...(row.property_images ?? [])]
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((image) => ({ url: image.url, alt: localized(image, 'alt', locale) || card.title }));

  return {
    ...card,
    description: localized(row, 'description', locale),
    address: row.address,
    features: row.features ?? [],
    images,
  };
}

/** Distinct locations across published properties, for the filter control. */
export async function getPropertyLocations(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  client: any = createAnonClient(),
): Promise<string[]> {
  if (!client) return [];
  const { data } = await client.from('properties').select('location').eq('is_published', true);
  const locations = new Set<string>((data ?? []).map((row: { location: string }) => row.location));
  return [...locations].sort();
}
