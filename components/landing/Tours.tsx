'use client';

import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { Display, Kicker } from './Display';
import { useDrawer } from './DrawerContext';
import { formatNumber } from '@/lib/format';
import type { TourCard } from '@/lib/data/tours';

export function Tours({ tours }: { tours: TourCard[] }) {
  const t = useTranslations('landing.tours');
  const { open } = useDrawer();

  return (
    <section id="tours" className="bg-paper-2 py-28">
      <div className="mx-auto max-w-container px-6">
        <div className="mb-10 max-w-2xl">
          <Kicker className="mb-3 text-gold-text">{t('kicker')}</Kicker>
          <Display before={t('titleA')} em={t('titleEm')} after={t('titleB')} className="text-ink-2" emClassName="" />
          <p className="mt-4 text-[17px] leading-[1.6] text-muted-body">{t('sub')}</p>
        </div>

        {tours.length === 0 ? (
          <p className="rounded-card border border-dashed border-line-2 bg-white p-12 text-center text-muted">
            {t('empty')}
          </p>
        ) : (
          <div className="grid gap-6 [grid-template-columns:repeat(auto-fit,minmax(min(100%,280px),1fr))]">
            {tours.map((tour) => (
              <article
                key={tour.id}
                className="group relative flex min-h-[380px] flex-col justify-end overflow-hidden rounded-card"
              >
                {tour.coverUrl && (
                  <Image
                    src={tour.coverUrl}
                    alt={tour.title}
                    fill
                    className="object-cover transition-transform duration-[900ms] ease-smooth group-hover:scale-[1.06]"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                )}
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(11,18,32,0)_30%,rgba(11,18,32,.92)_100%)]" />

                <div className="relative p-6">
                  <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-gold-accent">
                    {tour.durationHours ?? '—'} {t('hours')} · {tour.distanceKm ?? '—'} {t('km')}
                  </p>
                  <h3 className="mt-2 text-2xl font-semibold text-white">{tour.title}</h3>
                  {tour.blurb && <p className="mt-2 text-sm leading-relaxed text-white/75">{tour.blurb}</p>}

                  <div className="mt-5 flex items-center justify-between gap-3">
                    <p className="text-[15px] font-semibold text-white">
                      {formatNumber(tour.pricePerPerson)} {tour.currency}{' '}
                      <span className="font-normal text-white/70">{t('perPerson')}</span>
                    </p>
                    <button
                      type="button"
                      onClick={() =>
                        open('tour', {
                          id: tour.id,
                          title: tour.title,
                          subtitle: `${tour.durationHours ?? '—'} ${t('hours')} · ${tour.distanceKm ?? '—'} ${t('km')} · ${formatNumber(tour.pricePerPerson)} ${tour.currency} ${t('perPerson')}`,
                          image: tour.coverUrl,
                          currency: tour.currency,
                          pricePerPerson: tour.pricePerPerson,
                          maxGuests: tour.maxSeats,
                        })
                      }
                      className="h-[42px] shrink-0 rounded-xl bg-white px-5 text-sm font-semibold text-ink-2 transition hover:bg-gold-accent"
                    >
                      {t('bookTour')}
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
