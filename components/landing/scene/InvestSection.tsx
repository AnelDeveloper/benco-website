import { getLocale, getTranslations } from 'next-intl/server';
import { getFeaturedProject } from '@/lib/data/projects';
import { formatNumber } from '@/lib/format';
import { Display, Kicker } from '../Display';
import { BuildScene, type SceneStage } from './BuildScene';
import { OfferCards } from './OfferCards';
import type { Locale } from '@/lib/localized';

/** "Mar 2026" from an ISO date, without locale-dependent formatting. */
const MONTHS_EN = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const MONTHS_BS = ['Jan','Feb','Mar','Apr','Maj','Jun','Jul','Avg','Sep','Okt','Nov','Dec'];

function shortDate(iso: string | null, locale: Locale): string | null {
  if (!iso) return null;
  const match = /^(\d{4})-(\d{2})/.exec(iso);
  if (!match) return null;
  const months = locale === 'bs' ? MONTHS_BS : MONTHS_EN;
  return `${months[Number(match[2]) - 1]} ${match[1]}`;
}

export async function InvestSection() {
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations('landing.build');
  const project = await getFeaturedProject(locale);

  const stages: SceneStage[] = (project?.milestones ?? []).map((m) => ({
    title: m.title,
    date: shortDate(m.targetDate, locale),
    isDone: m.isDone,
  }));

  const intro = project
    ? `${project.title} · ${project.totalUnits ?? '—'} ${locale === 'bs' ? 'stanova' : 'units'} · ${project.location}. ${t('intro')}`
    : t('intro');

  return (
    <section id="invest" className="bg-ink">
      <div className="mx-auto max-w-container px-6 pt-24">
        <div className="grid gap-8 lg:grid-cols-[1fr_minmax(0,460px)] lg:items-end">
          <div>
            <Kicker className="mb-3 text-gold-accent">{t('kicker')}</Kicker>
            <Display
              before={t('titleA')}
              em={t('titleEm')}
              after={t('titleB')}
              className="text-white"
            />
          </div>
          <p className="text-[17px] leading-[1.6] text-white/70">{intro}</p>
        </div>
      </div>

      <BuildScene
        floorCount={5}
        stages={stages}
        progressPercent={project?.progressPercent ?? 0}
        completion={shortDate(project?.expectedCompletion ?? null, locale)}
        panel={
          project ? (
            <OfferCards
              project={{
                id: project.id,
                title: project.title,
                location: project.location,
                image: project.coverImage,
                currency: project.currency,
                pricePerM2: project.pricePerM2,
                minInvestment: project.minInvestment,
                expectedReturnPercent: project.expectedReturnPercent,
                availableUnits: project.availableUnits,
                totalUnits: project.totalUnits,
                fundingGoal: project.fundingGoal,
                fundedAmount: project.fundedAmount,
                offersOffplan: project.offersOffplan,
                offersInvestment: project.offersInvestment,
              }}
              labels={{
                offplanTitle: t('offplanTitle'),
                units: project.availableUnits !== null && project.totalUnits !== null
                  ? t('offplanUnits', { available: project.availableUnits, total: project.totalUnits })
                  : '',
                reserveUnit: t('reserveUnit'),
                investTitle: t('investTitle'),
                expectedReturn: t('expectedReturn'),
                investFrom: t('investFrom'),
                perM2: `${formatNumber(project.pricePerM2)} ${project.currency} / m²`,
              }}
            />
          ) : null
        }
      />
    </section>
  );
}
