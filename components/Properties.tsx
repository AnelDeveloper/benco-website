import { getLocale, getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';
import { getFeaturedProperties } from '@/lib/data/properties';
import { PropertyCardLink } from '@/components/public/PropertyCard';
import type { Locale } from '@/lib/localized';

export async function Properties() {
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations('properties');
  const tDetail = await getTranslations('propertyDetail');
  const properties = await getFeaturedProperties(locale);

  return (
    <section id="properties" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            {t('title')}
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            {t('subtitle')}
          </p>
        </div>

        {properties.length === 0 ? (
          <p className="text-center text-lg text-gray-500 py-12">{t('empty')}</p>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {properties.map((property) => (
              <PropertyCardLink key={property.id} property={property} perNight={tDetail('perNight')} />
            ))}
          </div>
        )}

        <div className="text-center mt-12">
          <Link
            href="/properties"
            className="inline-flex items-center px-8 py-4 bg-gold-600 hover:bg-gold-500 text-white font-semibold rounded-lg transition-all duration-300 hover:scale-105 shadow-lg"
          >
            {t('viewAll')}
          </Link>
        </div>
      </div>
    </section>
  );
}
