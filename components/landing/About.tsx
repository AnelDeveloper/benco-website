import Image from 'next/image';
import { getTranslations } from 'next-intl/server';
import { Check } from 'lucide-react';
import { Display, Kicker } from './Display';

export async function About() {
  const t = await getTranslations('landing.about');
  const legacy = await getTranslations('about');

  const highlights = ['team', 'approach', 'transparency', 'portfolio'] as const;

  return (
    <section id="about" className="bg-paper py-28">
      <div className="mx-auto grid max-w-container gap-14 px-6 lg:grid-cols-2">
        <div className="relative">
          <div className="relative aspect-[4/5] overflow-hidden rounded-3xl bg-paper-3">
            <Image
              src="/images/properties/Vila sa jezerom 4.avif"
              alt=""
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
          </div>

          <div className="absolute -left-3 bottom-7 flex items-center gap-3 rounded-2xl bg-ink px-5 py-4 shadow-card">
            <Image src="/benco-logo.jpg" alt="" width={44} height={44} className="h-11 w-11 rounded-lg object-cover" />
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gold-accent">{t('since')}</p>
              <p className="mt-0.5 text-[13px] text-white/80">Gajev Trg 4, Sarajevo</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col justify-center">
          <Kicker className="mb-3 text-gold-text">{t('kicker')}</Kicker>
          <Display before={t('titleA')} em={t('titleEm')} after={t('titleB')} className="text-ink-2" emClassName="" />

          <p className="mt-6 text-[17px] leading-[1.65] text-muted-body">{legacy('description')}</p>

          <ul className="mt-7 grid gap-3 sm:grid-cols-2">
            {highlights.map((key) => (
              <li key={key} className="flex items-start gap-2.5">
                <span className="mt-0.5 flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full bg-gold-accent">
                  <Check size={13} className="text-[#1a1200]" />
                </span>
                <span className="text-[15px] text-ink-2">{legacy(`highlights.${key}` as 'highlights.team')}</span>
              </li>
            ))}
          </ul>

          <blockquote className="mt-8 border-l-2 border-gold-accent pl-5 font-display text-[22px] italic leading-snug text-ink-2">
            {legacy('quote')}
          </blockquote>
        </div>
      </div>
    </section>
  );
}
