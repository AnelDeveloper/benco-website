import { getLocale, getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { Building2, TrendingUp, Ruler, Users } from 'lucide-react';
import { getFeaturedProject, getSiteStats } from '@/lib/data/projects';
import { formatDate } from '@/lib/format';
import { BuildingScene, type Stage } from './BuildingScene';
import { Counter } from './Counter';
import type { Locale } from '@/lib/localized';

/**
 * "Investiramo i gradimo" — the construction story.
 *
 * Stages come from the first published project still under construction. When
 * there is none, generic phase labels keep the section from rendering empty.
 */
export async function InvestBuild() {
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations('buildSection');
  const ti = await getTranslations('invest');

  const [project, stats] = await Promise.all([getFeaturedProject(locale), getSiteStats()]);

  const fallbackStages: Stage[] = [
    { title: ti('milestones'), date: null, isDone: true },
  ];

  const stages: Stage[] =
    project && project.milestones.length > 0
      ? project.milestones.map((milestone) => ({
          title: milestone.title,
          date: formatDate(milestone.targetDate),
          isDone: milestone.isDone,
        }))
      : fallbackStages;

  const counters = [
    { icon: Building2, value: stats.projects_completed, label: t('projectsCompleted'), suffix: '' },
    { icon: Ruler, value: stats.sqm_delivered, label: t('sqmDelivered'), suffix: '' },
    { icon: Users, value: stats.investors_count, label: t('investors'), suffix: '' },
    { icon: TrendingUp, value: stats.years_experience, label: t('yearsExperience'), suffix: '' },
  ];

  return (
    <section id="invest-build" className="relative bg-slate-900">
      {/*
        The glow gets its own clipping wrapper rather than `overflow-hidden` on
        the section: an ancestor with overflow-hidden silently disables
        position:sticky, which is what drives the scroll animation below.
      */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-0 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-gold-500/10 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 pt-20 text-center sm:px-6 lg:px-8">
        <h2 className="text-4xl font-bold text-white md:text-5xl">{t('title')}</h2>
        <p className="mx-auto mt-3 max-w-2xl text-lg text-slate-300">{t('subtitle')}</p>
        {project && (
          <p className="mt-4 inline-block rounded-full border border-gold-500/40 bg-gold-500/10 px-4 py-1.5 text-sm font-medium text-gold-300">
            {project.title} · {project.location}
          </p>
        )}
      </div>

      <BuildingScene
        stages={stages}
        progressPercent={project?.progressPercent ?? 0}
        labels={{ scrollHint: t('scrollHint'), progress: ti('progress') }}
      />

      <div className="relative mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-4 border-t border-slate-700/60 pt-12 lg:grid-cols-4">
          {counters.map(({ icon: Icon, value, label, suffix }) => (
            <div key={label} className="text-center">
              <Icon size={22} className="mx-auto mb-2 text-gold-500" />
              <p className="text-3xl font-bold text-white md:text-4xl">
                <Counter value={value} suffix={suffix} />
              </p>
              <p className="mt-1 text-sm text-slate-400">{label}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Link
            href="/invest"
            className="inline-flex items-center gap-2 rounded-lg bg-gold-600 px-8 py-4 font-semibold text-white shadow-lg transition-all duration-300 hover:scale-105 hover:bg-gold-500"
          >
            {t('cta')} →
          </Link>
        </div>
      </div>
    </section>
  );
}
