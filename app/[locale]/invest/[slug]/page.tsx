import Image from 'next/image';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getTranslations, getLocale } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { ArrowLeft, MapPin, Check, Circle, CalendarDays, Building2, TrendingUp } from 'lucide-react';
import { SiteShell } from '@/components/landing/SiteShell';
import { Footer } from '@/components/landing/Footer';
import { RequestForm } from '@/components/public/RequestForm';
import { getProjectBySlug } from '@/lib/data/projects';
import { formatNumber } from '@/lib/format';
import type { Locale } from '@/lib/localized';

export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; locale: string }>;
}): Promise<Metadata> {
  const { slug, locale } = await params;
  const project = await getProjectBySlug(slug, locale as Locale);
  if (!project) return { title: 'Ben&Co' };
  return {
    title: project.title,
    description: project.description.slice(0, 160) || `${project.title}, ${project.location}`,
  };
}

export default async function ProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const locale = (await getLocale()) as Locale;
  const project = await getProjectBySlug(slug, locale);
  if (!project) notFound();

  const t = await getTranslations('invest');
  const tr = await getTranslations('requestForm');

  // Projects are reserved through the page's own cards, not the nav.
  const bookItem = null;

  const fundedPercent =
    project.fundingGoal && project.fundingGoal > 0
      ? Math.min(100, Math.round((project.fundedAmount / project.fundingGoal) * 100))
      : null;

  const facts = [
    project.totalUnits !== null && { label: t('units'), value: String(project.totalUnits) },
    project.availableUnits !== null && { label: t('available'), value: String(project.availableUnits) },
    project.pricePerM2 !== null && { label: t('pricePerM2'), value: `${project.pricePerM2} ${project.currency}` },
    project.expectedCompletion && { label: t('completion'), value: project.expectedCompletion },
  ].filter(Boolean) as { label: string; value: string }[];

  return (
    <SiteShell bookItem={bookItem} footer={<Footer />}>

      <div className="mx-auto max-w-7xl px-4 pt-28 sm:px-6 lg:px-8">
        <Link href="/invest" className="inline-flex items-center gap-1.5 text-sm text-muted-body hover:text-ink-2">
          <ArrowLeft size={15} /> {t('back')}
        </Link>
      </div>

      <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <h1 className="font-display text-[clamp(34px,5vw,54px)] font-normal leading-[1.02] tracking-[-0.02em] text-ink-2">
          {project.title}
        </h1>
        <p className="mt-2 flex items-center gap-1.5 text-muted-body">
          <MapPin size={17} /> {project.location}
        </p>

        {project.images.length > 0 && (
          <div className="relative mt-6 h-80 overflow-hidden rounded-card bg-slate-200 md:h-[420px]">
            <Image
              src={project.images[0].url}
              alt={project.images[0].alt}
              fill
              className="object-cover"
              sizes="100vw"
              priority
            />
          </div>
        )}

        <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_400px]">
          <div>
            <div className="rounded-card border border-line bg-white p-6">
              <div className="mb-2 flex items-center justify-between">
                <span className="font-medium text-ink-2">{t('progress')}</span>
                <span className="font-display text-3xl text-gold-text">{project.progressPercent}%</span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-paper-3">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-gold-500 to-gold-600"
                  style={{ width: `${project.progressPercent}%` }}
                />
              </div>

              {fundedPercent !== null && (
                <div className="mt-6">
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="text-ink-2">{t('funded')}</span>
                    <span className="font-semibold text-ink-2">
                      {formatNumber(project.fundedAmount)} / {formatNumber(project.fundingGoal)} {project.currency}
                    </span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-paper-3">
                    <div className="h-full rounded-full bg-green-500" style={{ width: `${fundedPercent}%` }} />
                  </div>
                </div>
              )}
            </div>

            {facts.length > 0 && (
              <div className="mt-6 grid grid-cols-2 gap-4 rounded-card border border-line bg-white p-5 sm:grid-cols-4">
                {facts.map(({ label, value }) => (
                  <div key={label}>
                    <p className="text-xs text-muted">{label}</p>
                    <p className="font-semibold text-ink-2">{value}</p>
                  </div>
                ))}
              </div>
            )}

            {project.description && (
              <p className="mt-6 whitespace-pre-line text-lg leading-relaxed text-ink-2">
                {project.description}
              </p>
            )}

            {project.milestones.length > 0 && (
              <div className="mt-10">
                <h2 className="mb-5 font-display text-3xl text-ink-2">{t('milestones')}</h2>
                <ol className="relative space-y-1 border-l-2 border-line pl-6">
                  {project.milestones.map((milestone) => (
                    <li key={milestone.id} className="relative pb-6">
                      <span
                        className={`absolute -left-[31px] flex h-6 w-6 items-center justify-center rounded-full ${
                          milestone.isDone ? 'bg-green-600 text-white' : 'border-2 border-line-2 bg-white text-gray-300'
                        }`}
                      >
                        {milestone.isDone ? <Check size={13} /> : <Circle size={7} />}
                      </span>
                      <h3 className={`font-semibold ${milestone.isDone ? 'text-ink-2' : 'text-muted'}`}>
                        {milestone.title}
                      </h3>
                      {milestone.targetDate && (
                        <p className="flex items-center gap-1.5 text-sm text-muted">
                          <CalendarDays size={13} /> {milestone.targetDate}
                        </p>
                      )}
                      {milestone.description && (
                        <p className="mt-1 text-sm text-muted-body">{milestone.description}</p>
                      )}
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </div>

          <div className="space-y-6 lg:sticky lg:top-24 lg:self-start">
            {project.offersOffplan && (
              <RequestForm
                kind="offplan"
                projectId={project.id}
                currency={project.currency}
                accent="slate"
                labels={{
                  title: t('offplanTitle'), subtitle: t('offplanSubtitle'),
                  units: t('units_label'),
                  name: tr('name'), email: tr('email'), phone: tr('phone'), message: tr('message'),
                  submit: t('offplanCta'), submitting: tr('submitting'),
                  successTitle: tr('successTitle'), successBody: tr('successBody'), error: tr('error'),
                }}
              />
            )}

            {project.offersInvestment && (
              <div>
                {(project.minInvestment || project.expectedReturnPercent) && (
                  <div className="mb-3 flex flex-wrap gap-2">
                    {project.minInvestment && (
                      <span className="flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-medium text-ink-2 ring-1 ring-gray-200">
                        <Building2 size={13} /> {t('minInvestment')}: {formatNumber(project.minInvestment)} {project.currency}
                      </span>
                    )}
                    {project.expectedReturnPercent && (
                      <span className="flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-700">
                        <TrendingUp size={13} /> {project.expectedReturnPercent}% {t('expectedReturn')}
                      </span>
                    )}
                  </div>
                )}
                <RequestForm
                  kind="investment"
                  projectId={project.id}
                  currency={project.currency}
                  labels={{
                    title: t('investTitle'), subtitle: t('investSubtitle'),
                    amount: t('amount'),
                    name: tr('name'), email: tr('email'), phone: tr('phone'), message: tr('message'),
                    submit: t('investCta'), submitting: tr('submitting'),
                    successTitle: tr('successTitle'), successBody: tr('successBody'), error: tr('error'),
                  }}
                />
              </div>
            )}
          </div>
        </div>
      </section>

    </SiteShell>
  );
}
