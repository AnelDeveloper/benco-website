import Image from 'next/image';
import { Link } from '@/i18n/routing';
import { MapPin, BedDouble, Bath, Maximize } from 'lucide-react';
import { formatNumber } from '@/lib/format';
import type { PropertyCard as Card } from '@/lib/data/properties';

export function PropertyCardLink({ property, perNight }: { property: Card; perNight: string }) {
  const price =
    property.listingMode === 'rent'
      ? property.pricePerNight
        ? `${property.pricePerNight} ${property.currency} ${perNight}`
        : null
      : property.price
        ? `${formatNumber(property.price)} ${property.currency}`
        : null;

  return (
    <Link
      href={`/properties/${property.slug}`}
      className="group relative block overflow-hidden rounded-2xl shadow-lg transition-all duration-500 hover:shadow-2xl"
    >
      <div className="relative h-72 overflow-hidden bg-gray-100">
        {property.coverImage && (
          <Image
            src={property.coverImage}
            alt={property.coverAlt}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-110"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
        <h3 className="text-lg font-bold">{property.title}</h3>
        <p className="mt-1 flex items-center gap-1.5 text-sm text-white/85">
          <MapPin size={15} /> {property.location}
        </p>

        <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-white/85">
          {property.bedrooms !== null && (
            <span className="flex items-center gap-1"><BedDouble size={15} /> {property.bedrooms}</span>
          )}
          {property.bathrooms !== null && (
            <span className="flex items-center gap-1"><Bath size={15} /> {property.bathrooms}</span>
          )}
          {property.areaM2 !== null && (
            <span className="flex items-center gap-1"><Maximize size={15} /> {property.areaM2} m²</span>
          )}
        </div>

        {price && <p className="mt-3 text-lg font-bold text-gold-400">{price}</p>}
      </div>
    </Link>
  );
}
