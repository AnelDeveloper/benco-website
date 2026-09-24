import { getTranslations, getLocale } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { SiteShell } from '@/components/landing/SiteShell';
import { Footer } from '@/components/landing/Footer';
import { PropertyCardLink } from '@/components/public/PropertyCard';
import { getPublishedProperties, getPropertyLocations } from '@/lib/data/properties';
import type { Locale } from '@/lib/localized';

export const revalidate = 120;

const TYPES = ['villa', 'apartment', 'house', 'land'] as const;

export default async function PropertiesPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; mode?: string; location?: string }>;
}) {
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations('propertiesPage');
  const tp = await getTranslations('properties');
  const td = await getTranslations('propertyDetail');
  const filters = await searchParams;

  const [properties, locations] = await Promise.all([
    getPublishedProperties(locale, filters),
    getPropertyLocations(),
  ]);

  // The nav's "Rezerviši" opens the first place that can actually be booked.
  const rentable = properties.find((property) => property.listingMode !== 'sale');
  const bookItem = rentable
    ? {
        id: rentable.id,
        title: rentable.title,
        subtitle: `${rentable.location}${rentable.pricePerNight ? ` · ${rentable.pricePerNight} ${rentable.currency}` : ''}`,
        image: rentable.coverImage,
        currency: rentable.currency,
        pricePerNight: rentable.pricePerNight,
        price: rentable.price,
        maxGuests: rentable.maxGuests,
      }
    : null;

  const chip = (active: boolean) =>
    `rounded-full px-4 py-2 text-sm font-medium transition ${
      active ? 'bg-gold-deep text-white' : 'bg-white text-ink-2 hover:bg-paper-3 border border-line'
    }`;

  const withFilter = (key: string, value?: string) => {
    const next = { ...filters, [key]: value } as Record<string, string | undefined>;
    const query = Object.entries(next)
      .filter(([, v]) => v)
      .map(([k, v]) => `${k}=${encodeURIComponent(v as string)}`)
      .join('&');
    return query ? `/properties?${query}` : '/properties';
  };

  return (
    <SiteShell bookItem={bookItem} footer={<Footer />}>

      <section className="bg-ink px-6 pb-16 pt-32 text-center">
        <h1 className="font-display text-[clamp(36px,4.6vw,60px)] font-normal leading-[1.02] tracking-[-0.02em] text-white">
          {t('title')}
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-lg text-white/70">{t('subtitle')}</p>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8 space-y-3">
          <div className="flex flex-wrap gap-2">
            <Link href={withFilter('type', undefined)} className={chip(!filters.type)}>{t('all')}</Link>
            {TYPES.map((type) => (
              <Link key={type} href={withFilter('type', type)} className={chip(filters.type === type)}>
                {tp(`types.${type}` as 'types.villa')}
              </Link>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            <Link href={withFilter('mode', undefined)} className={chip(!filters.mode)}>{t('all')}</Link>
            <Link href={withFilter('mode', 'sale')} className={chip(filters.mode === 'sale')}>{t('forSale')}</Link>
            <Link href={withFilter('mode', 'rent')} className={chip(filters.mode === 'rent')}>{t('forRent')}</Link>
          </div>

          {locations.length > 1 && (
            <div className="flex flex-wrap gap-2">
              <Link href={withFilter('location', undefined)} className={chip(!filters.location)}>{t('all')}</Link>
              {locations.map((location) => (
                <Link key={location} href={withFilter('location', location)} className={chip(filters.location === location)}>
                  {location}
                </Link>
              ))}
            </div>
          )}
        </div>

        <p className="mb-6 text-sm text-muted-body">{properties.length} {t('count')}</p>

        {properties.length === 0 ? (
          <p className="rounded-card border border-dashed border-line-2 bg-white p-12 text-center text-muted-body">
            {t('empty')}
          </p>
        ) : (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {properties.map((property) => (
              <PropertyCardLink key={property.id} property={property} perNight={td('perNight')} />
            ))}
          </div>
        )}
      </section>

    </SiteShell>
  );
}
