import { describe, expect, it } from 'vitest';
import { getFeaturedProperties, toPropertyCard } from './properties';

const row = {
  id: 'p1',
  slug: 'vila-sa-jezerom',
  title_bs: 'Vila sa jezerom',
  title_en: 'Lakeside villa',
  property_type: 'villa' as const,
  listing_mode: 'sale' as const,
  location: 'Sarajevo',
  price: 450000,
  price_per_night: null,
  currency: 'BAM',
  area_m2: 320,
  bedrooms: 4,
  bathrooms: 3,
  property_images: [
    { url: '/images/b.avif', alt_bs: null, alt_en: null, sort_order: 2 },
    { url: '/images/a.avif', alt_bs: 'Prednja strana', alt_en: 'Front', sort_order: 1 },
  ],
};

/** Minimal stand-in for the Supabase query builder: every method returns the
 *  builder, and awaiting the builder resolves to the canned response. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function fakeClient(data: unknown, error: unknown = null): any {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const builder: any = {
    select: () => builder,
    eq: () => builder,
    order: () => builder,
    limit: () => builder,
    then: (resolve: (value: unknown) => unknown) => resolve({ data, error }),
  };
  return { from: () => builder };
}

describe('toPropertyCard', () => {
  it('uses the title for the requested locale', () => {
    expect(toPropertyCard(row, 'en').title).toBe('Lakeside villa');
    expect(toPropertyCard(row, 'bs').title).toBe('Vila sa jezerom');
  });

  it('picks the lowest sort_order image as the cover', () => {
    expect(toPropertyCard(row, 'bs').coverImage).toBe('/images/a.avif');
  });

  it('uses the cover image alt text for the requested locale', () => {
    expect(toPropertyCard(row, 'en').coverAlt).toBe('Front');
  });

  it('falls back to the title as alt text when the image has none', () => {
    const noAlt = { ...row, property_images: [{ url: '/x.avif', alt_bs: null, alt_en: null, sort_order: 1 }] };
    expect(toPropertyCard(noAlt, 'bs').coverAlt).toBe('Vila sa jezerom');
  });

  it('returns a null cover when the property has no images', () => {
    expect(toPropertyCard({ ...row, property_images: [] }, 'bs').coverImage).toBeNull();
  });
});

describe('getFeaturedProperties', () => {
  it('maps returned rows to cards', async () => {
    const result = await getFeaturedProperties('bs', fakeClient([row]));
    expect(result).toHaveLength(1);
    expect(result[0].slug).toBe('vila-sa-jezerom');
  });

  it('returns an empty array when Supabase reports an error', async () => {
    const result = await getFeaturedProperties('bs', fakeClient(null, { message: 'boom' }));
    expect(result).toEqual([]);
  });

  it('returns an empty array when no client is configured', async () => {
    const result = await getFeaturedProperties('bs', null);
    expect(result).toEqual([]);
  });
});
