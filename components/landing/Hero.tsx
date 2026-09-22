'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { BedDouble, Building2, Car, ArrowRight } from 'lucide-react';
import { Display, Kicker } from './Display';
import { useDrawer, type DrawerItem } from './DrawerContext';

export type HeroStay = DrawerItem & { location: string; propertyType: string };
export type HeroTour = DrawerItem;

type Tab = 'stay' | 'invest' | 'tour';

function Cell({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1 rounded-xl bg-paper-3 px-3.5 py-2.5">
      <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">{label}</span>
      {children}
    </label>
  );
}

const selectClass =
  'w-full cursor-pointer border-0 bg-transparent p-0 text-[15px] font-medium text-ink-2 outline-none';

export function Hero({
  stays,
  tours,
  projectTitle,
}: {
  stays: HeroStay[];
  tours: HeroTour[];
  projectTitle: string | null;
}) {
  const t = useTranslations('landing.hero');
  const { open } = useDrawer();
  const [tab, setTab] = useState<Tab>('stay');
  const [scale, setScale] = useState(1);

  const [where, setWhere] = useState('');
  const [type, setType] = useState('');
  const [tourId, setTourId] = useState(tours[0]?.id ?? '');

  useEffect(() => {
    // Gentle parallax: the cap keeps the crop from drifting far enough to
    // reveal the image edges on tall screens.
    const onScroll = () => setScale(1 + Math.min(0.12, window.scrollY / 6000));
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const locations = [...new Set(stays.map((s) => s.location))];

  function checkAvailability() {
    const match =
      stays.find(
        (s) =>
          (!where || s.location === where) && (!type || s.propertyType === type),
      ) ?? stays[0];
    if (match) open('stay', match);
  }

  function bookTour() {
    const tour = tours.find((x) => x.id === tourId) ?? tours[0];
    if (tour) open('tour', tour);
  }

  const tabs: { id: Tab; label: string; icon: typeof BedDouble }[] = [
    { id: 'stay', label: t('tabStay'), icon: BedDouble },
    { id: 'invest', label: t('tabInvest'), icon: Building2 },
    { id: 'tour', label: t('tabTour'), icon: Car },
  ];

  const cta =
    'flex h-[62px] items-center justify-center gap-2 rounded-xl bg-ink-2 px-5 text-[15px] font-semibold text-white transition hover:bg-gold-deep';

  return (
    <section id="top" className="relative flex min-h-screen items-end overflow-hidden bg-ink">
      <Image
        src="/images/properties/Vila sa jezerom 1.avif"
        alt=""
        fill
        priority
        className="object-cover transition-transform duration-100 ease-linear"
        style={{ transform: `scale(${scale})` }}
        sizes="100vw"
      />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(11,18,32,.55)_0%,rgba(11,18,32,.15)_40%,rgba(11,18,32,.85)_100%)]" />

      <div className="relative z-[2] mx-auto w-full max-w-container px-6 pb-14 pt-[140px]">
        <Kicker className="mb-[18px] animate-rise text-gold-accent">{t('kicker')}</Kicker>

        <Display
          as="h1"
          size="hero"
          before={t('titleA')}
          em={t('titleEm')}
          after={t('titleB')}
          className="max-w-[14ch] animate-rise text-white [animation-delay:.1s]"
        />

        <p className="mt-[22px] max-w-[520px] animate-rise text-lg leading-[1.55] text-white/80 [animation-delay:.2s]">
          {t('sub')}
        </p>

        <div className="mt-10 animate-rise overflow-hidden rounded-bar bg-white/[0.96] shadow-bar [animation-delay:.35s]">
          <div className="flex gap-1 p-2 pb-0">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                className={`flex h-11 flex-1 items-center justify-center gap-2 rounded-xl text-sm font-semibold transition-all duration-[250ms] ${
                  tab === id ? 'bg-ink-2 text-white' : 'text-muted-body hover:bg-paper-3'
                }`}
              >
                <Icon size={16} /> {label}
              </button>
            ))}
          </div>

          <div className="grid gap-2 p-2 [grid-template-columns:repeat(auto-fit,minmax(160px,1fr))]">
            {tab === 'stay' && (
              <>
                <Cell label={t('where')}>
                  <select value={where} onChange={(e) => setWhere(e.target.value)} className={selectClass}>
                    <option value="">{t('anywhere')}</option>
                    {locations.map((l) => (
                      <option key={l} value={l}>{l}</option>
                    ))}
                  </select>
                </Cell>
                <Cell label={t('type')}>
                  <select value={type} onChange={(e) => setType(e.target.value)} className={selectClass}>
                    <option value="">{t('any')}</option>
                    <option value="apartment">Apartman</option>
                    <option value="villa">Vila</option>
                  </select>
                </Cell>
                <Cell label={t('guests')}>
                  <select defaultValue="2" className={selectClass}>
                    <option>2</option><option>4</option><option>6+</option>
                  </select>
                </Cell>
                <button type="button" onClick={checkAvailability} className={cta}>
                  {t('checkAvailability')} <ArrowRight size={17} />
                </button>
              </>
            )}

            {tab === 'invest' && (
              <>
                <Cell label={t('project')}>
                  <select className={selectClass}>
                    <option>{projectTitle ?? '—'}</option>
                  </select>
                </Cell>
                <Cell label={t('iWantTo')}>
                  <select className={selectClass}>
                    <option>{t('investReturn')}</option>
                    <option>{t('buyOffplan')}</option>
                  </select>
                </Cell>
                <Cell label={t('budget')}>
                  <select className={selectClass}>
                    <option>20–50k BAM</option><option>50–150k BAM</option><option>150k+ BAM</option>
                  </select>
                </Cell>
                <a href="#invest" className={cta}>
                  {t('seeProject')} <ArrowRight size={17} />
                </a>
              </>
            )}

            {tab === 'tour' && (
              <>
                <Cell label={t('route')}>
                  <select value={tourId} onChange={(e) => setTourId(e.target.value)} className={selectClass}>
                    {tours.map((tour) => (
                      <option key={tour.id} value={tour.id}>{tour.title}</option>
                    ))}
                  </select>
                </Cell>
                <Cell label={t('when')}>
                  <select className={selectClass}>
                    <option>{t('thisWeekend')}</option><option>{t('nextWeek')}</option><option>{t('pickDate')}</option>
                  </select>
                </Cell>
                <Cell label={t('seats')}>
                  <select defaultValue="2" className={selectClass}>
                    <option>2</option><option>4</option><option>6</option>
                  </select>
                </Cell>
                <button type="button" onClick={bookTour} disabled={tours.length === 0} className={`${cta} disabled:opacity-50`}>
                  {t('bookTour')} <ArrowRight size={17} />
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
