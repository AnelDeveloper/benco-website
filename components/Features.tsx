'use client';

import { useTranslations } from 'next-intl';
import { Award, Shield, Building2 } from 'lucide-react';

export function Features() {
  const t = useTranslations('features');

  const features = [
    {
      icon: Award,
      title: t('experience.title'),
      description: t('experience.description'),
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      icon: Shield,
      title: t('quality.title'),
      description: t('quality.description'),
      color: 'text-green-600',
      bg: 'bg-green-50',
    },
    {
      icon: Building2,
      title: t('portfolio.title'),
      description: t('portfolio.description'),
      color: 'text-gold-600',
      bg: 'bg-gold-50',
    },
  ];

  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            {t('title')}
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2 group"
              >
                <div className={`w-16 h-16 ${feature.bg} rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                  <Icon className={feature.color} size={32} />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
