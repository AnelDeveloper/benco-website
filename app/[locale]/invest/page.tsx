import Image from 'next/image';
import { getTranslations, getLocale } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { MapPin, TrendingUp, Building2 } from 'lucide-react';
import { SiteShell } from '@/components/landing/SiteShell';
import { Footer } from '@/components/landing/Footer';
import { getPublishedProjects } from '@/lib/data/projects';
import type { Locale } from '@/lib/localized';

export const revalidate = 120;

export default async function InvestPage() {
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations('invest');
  const projects = await getPublishedProjects(locale);

  // Projects are reserved through the page's own cards, not the nav.
  const bookItem = null;

  const statusLabel = (status: string) =>
    status === 'planning' ? t('statusPlanning')
      : status === 'completed' ? t('statusCompleted')
        : t('statusUnderConstruction');

  return (
    <SiteShell bookItem={bookItem} footer={<Footer />}>

      <section className="bg-ink px-6 pb-16 pt-32 text-center">
        <h1 className="font-display text-[clamp(36px,4.6vw,60px)] font-normal leading-[1.02] tracking-[-0.02em] text-white">
          {t('title')}
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-lg text-white/70">{t('subtitle')}</p>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {projects.length === 0 ? (
          <p className="rounded-card border border-dashed border-line-2 bg-white p-12 text-center text-muted-body">
            {t('empty')}
          </p>
        ) : (
          <div className="grid gap-8 md:grid-cols-2">
            {projects.map((project) => (
              <Link
                key={project.id}
                href={`/invest/${project.slug}`}
                className="group overflow-hidden rounded-card bg-white shadow-lg transition hover:shadow-2xl"
              >
                <div className="relative h-56 bg-slate-200">
                  {project.coverImage ? (
                    <Image
                      src={project.coverImage}
                      alt={project.title}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                  ) : (
                    <span className="flex h-full items-center justify-center text-slate-400">
                      <Building2 size={48} />
                    </span>
                  )}
                  <span className="absolute left-4 top-4 rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-slate-800">
                    {statusLabel(project.status)}
                  </span>
                </div>

                <div className="p-6">
                  <h2 className="text-xl font-bold text-ink-2">{project.title}</h2>
                  <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-body">
                    <MapPin size={15} /> {project.location}
                  </p>

                  <div className="mt-4">
                    <div className="mb-1.5 flex items-center justify-between text-sm">
                      <span className="text-muted-body">{t('progress')}</span>
                      <span className="font-bold text-gold-text">{project.progressPercent}%</span>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-paper-3">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-gold-500 to-gold-600"
                        style={{ width: `${project.progressPercent}%` }}
                      />
                    </div>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-2 text-xs">
                    {project.offersOffplan && project.pricePerM2 && (
                      <span className="rounded-full bg-blue-50 px-3 py-1.5 font-medium text-blue-700">
                        {t('pricePerM2')}: {project.pricePerM2} {project.currency}
                      </span>
                    )}
                    {project.offersInvestment && project.expectedReturnPercent && (
                      <span className="flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1.5 font-medium text-amber-700">
                        <TrendingUp size={13} /> {project.expectedReturnPercent}% {t('expectedReturn')}
                      </span>
                    )}
                  </div>

                  <p className="mt-5 font-semibold text-gold-text group-hover:underline">
                    {t('viewProject')} →
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

    </SiteShell>
  );
}
