import Image from 'next/image';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getTranslations, getLocale } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { ArrowLeft, MapPin, Check, Circle, CalendarDays, Building2, TrendingUp } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { RequestForm } from '@/components/public/RequestForm';
import { getProjectBySlug } from '@/lib/data/projects';
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
    <main className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="mx-auto max-w-7xl px-4 pt-28 sm:px-6 lg:px-8">
        <Link href="/invest" className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900">
          <ArrowLeft size={15} /> {t('back')}
        </Link>
      </div>

      <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 md:text-4xl">{project.title}</h1>
        <p className="mt-2 flex items-center gap-1.5 text-gray-600">
          <MapPin size={17} /> {project.location}
        </p>

        {project.images.length > 0 && (
          <div className="relative mt-6 h-80 overflow-hidden rounded-2xl bg-slate-200 md:h-[420px]">
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
            <div className="rounded-2xl border border-gray-200 bg-white p-6">
              <div className="mb-2 flex items-center justify-between">
                <span className="font-medium text-gray-700">{t('progress')}</span>
                <span className="text-2xl font-bold text-gold-600">{project.progressPercent}%</span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-gray-100">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-gold-500 to-gold-600"
                  style={{ width: `${project.progressPercent}%` }}
                />
              </div>

              {fundedPercent !== null && (
                <div className="mt-6">
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="text-gray-700">{t('funded')}</span>
                    <span className="font-semibold text-gray-900">
                      {project.fundedAmount.toLocaleString('bs-BA')} / {project.fundingGoal?.toLocaleString('bs-BA')} {project.currency}
                    </span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-gray-100">
                    <div className="h-full rounded-full bg-green-500" style={{ width: `${fundedPercent}%` }} />
                  </div>
                </div>
              )}
            </div>

            {facts.length > 0 && (
              <div className="mt-6 grid grid-cols-2 gap-4 rounded-2xl border border-gray-200 bg-white p-5 sm:grid-cols-4">
                {facts.map(({ label, value }) => (
                  <div key={label}>
                    <p className="text-xs text-gray-500">{label}</p>
                    <p className="font-semibold text-gray-900">{value}</p>
                  </div>
                ))}
              </div>
            )}

            {project.description && (
              <p className="mt-6 whitespace-pre-line text-lg leading-relaxed text-gray-700">
                {project.description}
              </p>
            )}

            {project.milestones.length > 0 && (
              <div className="mt-10">
                <h2 className="mb-5 text-2xl font-bold text-gray-900">{t('milestones')}</h2>
                <ol className="relative space-y-1 border-l-2 border-gray-200 pl-6">
                  {project.milestones.map((milestone) => (
                    <li key={milestone.id} className="relative pb-6">
                      <span
                        className={`absolute -left-[31px] flex h-6 w-6 items-center justify-center rounded-full ${
                          milestone.isDone ? 'bg-green-600 text-white' : 'border-2 border-gray-300 bg-white text-gray-300'
                        }`}
                      >
                        {milestone.isDone ? <Check size={13} /> : <Circle size={7} />}
                      </span>
                      <h3 className={`font-semibold ${milestone.isDone ? 'text-gray-900' : 'text-gray-500'}`}>
                        {milestone.title}
                      </h3>
                      {milestone.targetDate && (
                        <p className="flex items-center gap-1.5 text-sm text-gray-500">
                          <CalendarDays size={13} /> {milestone.targetDate}
                        </p>
                      )}
                      {milestone.description && (
                        <p className="mt-1 text-sm text-gray-600">{milestone.description}</p>
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
                      <span className="flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-medium text-gray-700 ring-1 ring-gray-200">
                        <Building2 size={13} /> {t('minInvestment')}: {project.minInvestment.toLocaleString('bs-BA')} {project.currency}
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

      <Footer />
    </main>
  );
}
