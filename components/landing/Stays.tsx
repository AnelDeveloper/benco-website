'use client';

import Image from 'next/image';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { MapPin, BedDouble, Bath, Maximize } from 'lucide-react';
import { Display, Kicker } from './Display';
import { useDrawer } from './DrawerContext';
import { formatNumber } from '@/lib/format';
import type { HeroStay } from './Hero';

export type StayCard = HeroStay & {
  slug: string;
  listingMode: 'sale' | 'rent' | 'both';
  bedrooms: number | null;
  bathrooms: number | null;
  areaM2: number | null;
  typeLabel: string;
};

type Filter = 'all' | 'villa' | 'apartment';

export function Stays({ properties }: { properties: StayCard[] }) {
  const t = useTranslations('landing.stays');
  const { open } = useDrawer();
  const [filter, setFilter] = useState<Filter>('all');

  const shown = properties.filter((p) => filter === 'all' || p.propertyType === filter);

  const pills: { id: Filter; label: string }[] = [
    { id: 'all', label: t('all') },
    { id: 'villa', label: t('villas') },
    { id: 'apartment', label: t('apartments') },
  ];

  return (
    <section id="stays" className="bg-paper pb-24 pt-28">
      <div className="mx-auto max-w-container px-6">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-6">
          <div>
            <Kicker className="mb-3 text-gold-text">{t('kicker')}</Kicker>
            <Display before={t('titleA')} em={t('titleEm')} after={t('titleB')} className="text-ink-2" emClassName="" />
          </div>

          <div className="flex gap-2">
            {pills.map(({ id, label }) => (
              <button
                key={id}
                type="button"
                onClick={() => setFilter(id)}
                className={`h-[38px] rounded-full px-4 text-sm font-medium transition ${
                  filter === id ? 'bg-ink-2 text-white' : 'border border-line-2 text-ink-2 hover:bg-paper-3'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {shown.length === 0 ? (
          <p className="rounded-card border border-dashed border-line-2 bg-white p-12 text-center text-muted">
            {t('empty')}
          </p>
        ) : (
          <div className="grid gap-6 [grid-template-columns:repeat(auto-fill,minmax(min(100%,300px),1fr))]">
            {shown.map((property) => {
              const canRent = property.listingMode !== 'sale';
              const canBuy = property.listingMode !== 'rent';

              const priceValue = canRent ? property.pricePerNight : property.price;
              const priceNote = !canRent
                ? t('forSale')
                : canBuy
                  ? t('perNightAlsoSale')
                  : t('perNight');

              const specs = [
                property.bedrooms !== null && { icon: BedDouble, value: `${property.bedrooms} bd` },
                property.bathrooms !== null && { icon: Bath, value: `${property.bathrooms} ba` },
                property.areaM2 !== null && { icon: Maximize, value: `${property.areaM2} m²` },
              ].filter(Boolean) as { icon: typeof BedDouble; value: string }[];

              return (
                <article
                  key={property.id}
                  className="group overflow-hidden rounded-card bg-white shadow-card transition-shadow duration-500 hover:shadow-card-hover"
                >
                  <div className="relative aspect-[4/3] overflow-hidden bg-paper-3">
                    {property.image && (
                      <Image
                        src={property.image}
                        alt={property.title}
                        fill
                        className="object-cover transition-transform duration-[900ms] ease-smooth group-hover:scale-[1.06]"
                        sizes="(max-width: 768px) 100vw, 300px"
                      />
                    )}
                    <span className="absolute left-3 top-3 rounded-full bg-white/[0.92] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-2">
                      {property.typeLabel} · {canRent ? t('tagStay') : t('tagSale')}
                    </span>
                  </div>

                  <div className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="truncate text-[19px] font-semibold text-ink-2">{property.title}</h3>
                        <p className="mt-1 flex items-center gap-1.5 text-[13px] text-muted">
                          <MapPin size={13} /> {property.location}
                        </p>
                      </div>
                      {priceValue !== null && priceValue !== undefined && (
                        <div className="shrink-0 text-right">
                          <p className="text-lg font-semibold text-ink-2">
                            {formatNumber(priceValue)} {property.currency}
                          </p>
                          <p className="text-xs text-muted">{priceNote}</p>
                        </div>
                      )}
                    </div>

                    {specs.length > 0 && (
                      <p className="mt-3 flex flex-wrap items-center gap-3 text-[13px] text-muted-body">
                        {specs.map(({ icon: Icon, value }) => (
                          <span key={value} className="flex items-center gap-1.5">
                            <Icon size={14} /> {value}
                          </span>
                        ))}
                      </p>
                    )}

                    <div className="mt-5 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => open(canRent ? 'stay' : 'offer', property)}
                        className="h-[42px] flex-1 rounded-xl bg-ink-2 text-sm font-semibold text-white transition hover:bg-gold-deep"
                      >
                        {canRent ? t('bookStay') : t('makeOffer')}
                      </button>
                      <Link
                        href={`/properties/${property.slug}`}
                        className="flex h-[42px] items-center rounded-xl border border-line-2 px-4 text-sm font-medium text-ink-2 transition hover:bg-paper-3"
                      >
                        {t('details')}
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
