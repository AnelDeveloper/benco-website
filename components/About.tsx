'use client';

import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { CheckCircle2 } from 'lucide-react';

export function About() {
  const t = useTranslations('about');

  const highlights = [
    { key: 'team', label: t('highlights.team') },
    { key: 'approach', label: t('highlights.approach') },
    { key: 'transparency', label: t('highlights.transparency') },
    { key: 'portfolio', label: t('highlights.portfolio') },
  ];

  return (
    <section id="about" className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Image */}
          <div className="relative h-[500px] rounded-2xl overflow-hidden shadow-2xl">
            <Image
              src="/images/properties/Vila sa jezerom 4.avif"
              alt="Ben&Co Office"
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
          </div>

          {/* Content */}
          <div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              {t('title')}
            </h2>
            <h3 className="text-2xl text-gold-600 font-semibold mb-6">
              {t('subtitle')}
            </h3>
            <p className="text-lg text-gray-700 mb-6 leading-relaxed">
              {t('description')}
            </p>
            <p className="text-lg text-gray-700 mb-8 leading-relaxed">
              {t('mission')}
            </p>

            <div className="space-y-4">
              {highlights.map((highlight) => (
                <div key={highlight.key} className="flex items-start space-x-3">
                  <CheckCircle2 className="text-gold-600 flex-shrink-0 mt-1" size={24} />
                  <span className="text-gray-700 text-lg">{highlight.label}</span>
                </div>
              ))}
            </div>

            <div className="mt-10 p-6 bg-white rounded-xl shadow-lg border-l-4 border-gold-600">
              <p className="text-gray-700 italic">
                "{t('quote')}"
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
