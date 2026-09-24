import Image from 'next/image';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getTranslations, getLocale } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { ArrowLeft, MapPin, BedDouble, Bath, Maximize, Users, Check } from 'lucide-react';
import { SiteShell } from '@/components/landing/SiteShell';
import { Footer } from '@/components/landing/Footer';
import { BookingForm } from '@/components/public/BookingForm';
import { RequestForm } from '@/components/public/RequestForm';
import { getPropertyBySlug } from '@/lib/data/properties';
import { formatNumber } from '@/lib/format';
import type { Locale } from '@/lib/localized';

export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; locale: string }>;
}): Promise<Metadata> {
  const { slug, locale } = await params;
  const property = await getPropertyBySlug(slug, locale as Locale);
  if (!property) return { title: 'Ben&Co' };

  return {
    title: property.title,
    description: property.description.slice(0, 160) || `${property.title}, ${property.location}`,
    openGraph: {
      title: property.title,
      description: property.description.slice(0, 160),
      images: property.coverImage ? [property.coverImage] : undefined,
    },
  };
}

export default async function PropertyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const locale = (await getLocale()) as Locale;
  const property = await getPropertyBySlug(slug, locale);
  if (!property) notFound();

  const t = await getTranslations('propertyDetail');
  const tb = await getTranslations('booking');
  const tpur = await getTranslations('purchase');
  const tr = await getTranslations('requestForm');
  const tl = await getTranslations('propertiesPage');

  const canBook = property.listingMode === 'rent' || property.listingMode === 'both';
  const canBuy = property.listingMode === 'sale' || property.listingMode === 'both';

  // Booking from the nav opens this property, not some other one.
  const bookItem = canBook
    ? {
        id: property.id,
        title: property.title,
        subtitle: `${property.location}${property.pricePerNight ? ` · ${property.pricePerNight} ${property.currency}` : ''}`,
        image: property.coverImage,
        currency: property.currency,
        pricePerNight: property.pricePerNight,
        price: property.price,
        maxGuests: property.maxGuests,
      }
    : null;

  const facts = [
    property.bedrooms !== null && { icon: BedDouble, label: t('bedrooms'), value: String(property.bedrooms) },
    property.bathrooms !== null && { icon: Bath, label: t('bathrooms'), value: String(property.bathrooms) },
    property.areaM2 !== null && { icon: Maximize, label: t('area'), value: `${property.areaM2} m²` },
    property.maxGuests !== null && { icon: Users, label: t('maxGuests'), value: String(property.maxGuests) },
  ].filter(Boolean) as { icon: typeof BedDouble; label: string; value: string }[];

  return (
    <SiteShell bookItem={bookItem} footer={<Footer />}>

      <div className="mx-auto max-w-7xl px-4 pt-28 sm:px-6 lg:px-8">
        <Link href="/properties" className="inline-flex items-center gap-1.5 text-sm text-muted-body hover:text-ink-2">
          <ArrowLeft size={15} /> {tl('back')}
        </Link>
      </div>

      <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <h1 className="font-display text-[clamp(34px,5vw,54px)] font-normal leading-[1.02] tracking-[-0.02em] text-ink-2">
          {property.title}
        </h1>
        <p className="mt-2 flex items-center gap-1.5 text-muted-body">
          <MapPin size={17} /> {property.address ? `${property.address}, ` : ''}{property.location}
        </p>

        {property.images.length > 0 && (
          <div className="mt-6 grid gap-3 md:grid-cols-4 md:grid-rows-2">
            {property.images.slice(0, 5).map((image, index) => (
              <div
                key={image.url}
                className={`relative overflow-hidden rounded-xl bg-paper-3 ${
                  index === 0 ? 'md:col-span-2 md:row-span-2 h-64 md:h-full' : 'h-40'
                }`}
              >
                <Image
                  src={image.url}
                  alt={image.alt}
                  fill
                  className="object-cover transition-transform duration-500 hover:scale-105"
                  sizes={index === 0 ? '(max-width: 768px) 100vw, 50vw' : '25vw'}
                  priority={index === 0}
                />
              </div>
            ))}
          </div>
        )}

        <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_400px]">
          <div>
            {facts.length > 0 && (
              <div className="grid grid-cols-2 gap-4 rounded-card border border-line bg-white p-5 sm:grid-cols-4">
                {facts.map(({ icon: Icon, label, value }) => (
                  <div key={label}>
                    <Icon size={20} className="mb-1.5 text-gold-text" />
                    <p className="text-xs text-muted">{label}</p>
                    <p className="font-semibold text-ink-2">{value}</p>
                  </div>
                ))}
              </div>
            )}

            {property.description && (
              <p className="mt-6 whitespace-pre-line text-lg leading-relaxed text-ink-2">
                {property.description}
              </p>
            )}

            {property.features.length > 0 && (
              <div className="mt-8">
                <h2 className="mb-3 font-display text-2xl text-ink-2">{t('features')}</h2>
                <ul className="flex flex-wrap gap-2">
                  {property.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-sm text-ink-2 ring-1 ring-gray-200"
                    >
                      <Check size={14} className="text-gold-text" /> {feature}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {canBuy && property.price !== null && (
              <div className="mt-8 rounded-card bg-ink p-6 text-white">
                <p className="text-sm text-slate-300">{t('price')}</p>
                <p className="font-display text-4xl text-gold-accent">
                  {formatNumber(property.price)} {property.currency}
                </p>
              </div>
            )}
          </div>

          <div className="space-y-6 lg:sticky lg:top-24 lg:self-start">
            {canBook && (
              <BookingForm
                propertyId={property.id}
                pricePerNight={property.pricePerNight}
                currency={property.currency}
                maxGuests={property.maxGuests}
                locale={locale}
                labels={{
                  title: tb('title'), subtitle: tb('subtitle'), name: tb('name'), email: tb('email'),
                  phone: tb('phone'), guests: tb('guests'), message: tb('message'), submit: tb('submit'),
                  submitting: tb('submitting'), nights: tb('nights'), total: tb('total'),
                  pickDates: tb('pickDates'), successTitle: tb('successTitle'),
                  successBody: tb('successBody'), perNight: tb('perNight'),
                }}
              />
            )}

            {canBuy && (
              <RequestForm
                kind="purchase"
                propertyId={property.id}
                currency={property.currency}
                accent="slate"
                labels={{
                  title: tpur('title'), subtitle: tpur('subtitle'), amount: tpur('amount'),
                  name: tr('name'), email: tr('email'), phone: tr('phone'), message: tr('message'),
                  submit: tpur('submit'), submitting: tr('submitting'),
                  successTitle: tr('successTitle'), successBody: tr('successBody'), error: tr('error'),
                }}
              />
            )}
          </div>
        </div>
      </section>

    </SiteShell>
  );
}
