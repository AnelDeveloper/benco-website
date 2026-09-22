'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useInView, useReducedMotion } from 'framer-motion';
import { formatNumber } from '@/lib/format';

export type Stats = {
  projects_completed: number;
  sqm_delivered: number;
  investors_count: number;
  years_experience: number;
};

/** easeOutExpo over 1600ms, per the design tokens. */
function useCountUp(value: number, active: boolean) {
  const reduceMotion = useReducedMotion();
  const [display, setDisplay] = useState(value);

  useEffect(() => {
    if (!active || reduceMotion) return;

    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / 1600);
      const eased = t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
      setDisplay(Math.round(value * eased));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    setDisplay(0);
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [active, value, reduceMotion]);

  return display;
}

function Stat({ value, label, suffix, active }: { value: number; label: string; suffix?: string; active: boolean }) {
  const display = useCountUp(value, active);
  return (
    <div className="border-l border-white/[0.12] pl-[18px]">
      <p className="font-display text-[44px] leading-none text-white [font-variant-numeric:tabular-nums]">
        {formatNumber(display)}
        {suffix && <span className="text-gold-accent">{suffix}</span>}
      </p>
      <p className="mt-2 text-[13px] text-muted-dark">{label}</p>
    </div>
  );
}

export function TrustStrip({ stats }: { stats: Stats }) {
  const t = useTranslations('landing.trust');
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });

  return (
    <section className="bg-ink py-9">
      <div
        ref={ref}
        className="mx-auto grid max-w-container gap-6 px-6 [grid-template-columns:repeat(auto-fit,minmax(180px,1fr))]"
      >
        <Stat value={stats.projects_completed} label={t('projects')} active={inView} />
        <Stat value={stats.sqm_delivered} label={t('sqm')} active={inView} />
        <Stat value={stats.investors_count} label={t('investors')} active={inView} />
        <Stat value={stats.years_experience} label={t('years')} suffix="+" active={inView} />
      </div>
    </section>
  );
}
