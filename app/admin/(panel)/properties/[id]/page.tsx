import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { requireAdmin } from '@/lib/auth/admin';
import { getPropertyForAdmin } from '@/lib/data/admin-properties';
import { PropertyForm } from '@/components/admin/PropertyForm';
import { DeleteButton } from '@/components/admin/DeleteButton';
import { ImageManager } from '@/components/admin/ImageManager';
import { updateProperty, deleteProperty } from '@/app/admin/_actions/properties';

export const dynamic = 'force-dynamic';

export default async function EditPropertyPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const property = await getPropertyForAdmin(id);
  if (!property) notFound();

  const update = updateProperty.bind(null, id);
  const remove = deleteProperty.bind(null, id);

  return (
    <div className="max-w-4xl">
      <Link href="/admin/properties" className="mb-4 inline-flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900">
        <ArrowLeft size={15} /> Nazad na nekretnine
      </Link>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{property.title_bs}</h1>
          <p className="mt-1 text-sm text-slate-500">/{property.slug}</p>
        </div>
        <div className="flex items-center gap-2">
          {property.is_published && (
            <a
              href={`/properties/${property.slug}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-100"
            >
              <ExternalLink size={15} /> Pogledaj
            </a>
          )}
          <DeleteButton action={remove} />
        </div>
      </div>

      <div className="mb-6">
        <ImageManager
          ownerId={id}
          kind="property"
          images={property.property_images ?? []}
        />
      </div>

      <PropertyForm action={update} property={property} />
    </div>
  );
}
