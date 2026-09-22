import { getLocale, getTranslations } from 'next-intl/server';
import { Landing } from '@/components/landing/Landing';
import { About } from '@/components/landing/About';
import { Footer } from '@/components/landing/Footer';
import { InvestSection } from '@/components/landing/scene/InvestSection';
import { getFeaturedProperties } from '@/lib/data/properties';
import { getFeaturedProject, getSiteStats } from '@/lib/data/projects';
import type { StayCard } from '@/components/landing/Stays';
import type { Locale } from '@/lib/localized';

// Re-fetch from the database at most every 5 minutes.
export const revalidate = 300;

export default async function HomePage() {
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations('properties');

  const [properties, project, stats] = await Promise.all([
    getFeaturedProperties(locale),
    getFeaturedProject(locale),
    getSiteStats(),
  ]);

  const typeLabel = (type: string) =>
    type === 'villa' ? t('types.villa') : type === 'apartment' ? t('types.apartment') : type;

  const stays: StayCard[] = properties.map((property) => ({
    id: property.id,
    slug: property.slug,
    title: property.title,
    subtitle: `${property.location} · ${
      property.pricePerNight ? `${property.pricePerNight} ${property.currency}` : ''
    }`.trim(),
    image: property.coverImage,
    location: property.location,
    propertyType: property.propertyType,
    typeLabel: typeLabel(property.propertyType),
    listingMode: property.listingMode,
    price: property.price,
    pricePerNight: property.pricePerNight,
    currency: property.currency,
    maxGuests: property.maxGuests,
    bedrooms: property.bedrooms,
    bathrooms: property.bathrooms,
    areaM2: property.areaM2,
  }));

  const bookItem = stays.find((s) => s.listingMode !== 'sale') ?? null;

  return (
    <Landing
      stays={stays}
      tours={[]}
      stats={stats}
      projectTitle={project?.title ?? null}
      bookItem={bookItem}
      build={<InvestSection />}
      toursSection={null}
      about={<About />}
      footer={<Footer />}
    />
  );
}
