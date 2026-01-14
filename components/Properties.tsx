'use client';

import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { MapPin, Home } from 'lucide-react';

export function Properties() {
  const t = useTranslations('properties');

  const properties = [
    {
      id: 1,
      image: '/images/properties/Vila sa jezerom 1.avif',
      type: t('types.villa'),
      location: t('locations.sarajevo'),
    },
    {
      id: 2,
      image: '/images/properties/Villa sa bazenom 1.avif',
      type: t('types.villa'),
      location: t('locations.sarajevo'),
    },
    {
      id: 3,
      image: '/images/properties/Apartman Dacha 1.jpeg',
      type: t('types.apartment'),
      location: t('locations.sarajevo'),
    },
    {
      id: 4,
      image: '/images/properties/Jahorina apartman1.avif',
      type: t('types.apartment'),
      location: t('locations.jahorina'),
    },
    {
      id: 5,
      image: '/images/properties/Vila sa jezerom 3.avif',
      type: t('types.villa'),
      location: t('locations.sarajevo'),
    },
    {
      id: 6,
      image: '/images/properties/Villa sa bazenom 3.avif',
      type: t('types.villa'),
      location: t('locations.sarajevo'),
    },
  ];

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

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {properties.map((property) => (
            <div
              key={property.id}
              className="group relative overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 cursor-pointer"
            >
              <div className="relative h-80 overflow-hidden">
                <Image
                  src={property.image}
                  alt={`${property.type} in ${property.location}`}
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-500"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </div>
              
              <div className="absolute bottom-0 left-0 right-0 p-6 text-white transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                <div className="flex items-center space-x-2 mb-2">
                  <Home size={18} />
                  <span className="font-semibold">{property.type}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <MapPin size={18} />
                  <span>{property.location}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <a
            href="#contact"
            className="inline-flex items-center px-8 py-4 bg-gold-600 hover:bg-gold-700 text-white font-semibold rounded-lg transition-all duration-300 hover:scale-105 shadow-lg"
          >
            {t('viewAll')}
          </a>
        </div>
      </div>
    </section>
  );
}
