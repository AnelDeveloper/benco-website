import Image from 'next/image';
import { getTranslations, getLocale } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { MapPin, TrendingUp, Building2 } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { getPublishedProjects } from '@/lib/data/projects';
import type { Locale } from '@/lib/localized';

export const revalidate = 120;

export default async function InvestPage() {
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations('invest');
  const projects = await getPublishedProjects(locale);

  const statusLabel = (status: string) =>
    status === 'planning' ? t('statusPlanning')
      : status === 'completed' ? t('statusCompleted')
        : t('statusUnderConstruction');

  return (
    <main className="min-h-screen bg-gray-50">
      <Navbar />

      <section className="bg-slate-900 px-4 pb-14 pt-32 text-center sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold text-white md:text-5xl">{t('title')}</h1>
        <p className="mx-auto mt-3 max-w-2xl text-lg text-slate-300">{t('subtitle')}</p>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {projects.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-gray-300 bg-white p-12 text-center text-gray-600">
            {t('empty')}
          </p>
        ) : (
          <div className="grid gap-8 md:grid-cols-2">
            {projects.map((project) => (
              <Link
                key={project.id}
                href={`/invest/${project.slug}`}
                className="group overflow-hidden rounded-2xl bg-white shadow-lg transition hover:shadow-2xl"
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
                  <h2 className="text-xl font-bold text-gray-900">{project.title}</h2>
                  <p className="mt-1 flex items-center gap-1.5 text-sm text-gray-600">
                    <MapPin size={15} /> {project.location}
                  </p>

                  <div className="mt-4">
                    <div className="mb-1.5 flex items-center justify-between text-sm">
                      <span className="text-gray-600">{t('progress')}</span>
                      <span className="font-bold text-gold-600">{project.progressPercent}%</span>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-gray-100">
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

                  <p className="mt-5 font-semibold text-gold-600 group-hover:underline">
                    {t('viewProject')} →
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <Footer />
    </main>
  );
}
