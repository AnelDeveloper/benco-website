import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { requireAdmin } from '@/lib/auth/admin';
import { createAdminClient } from '@/lib/supabase/admin';
import { TourForm } from '@/components/admin/TourForm';
import { DeleteButton } from '@/components/admin/DeleteButton';
import { updateTour, deleteTour } from '@/app/admin/_actions/tours';

export const dynamic = 'force-dynamic';

export default async function EditTourPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;

  const db = createAdminClient();
  const { data: tour } = await db.from('tours').select('*').eq('id', id).maybeSingle();
  if (!tour) notFound();

  return (
    <div className="max-w-4xl">
      <Link href="/admin/tours" className="mb-4 inline-flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900">
        <ArrowLeft size={15} /> Nazad na ture
      </Link>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{tour.title_bs}</h1>
          <p className="mt-1 text-sm text-slate-500">/{tour.slug}</p>
        </div>
        <DeleteButton action={deleteTour.bind(null, id)} />
      </div>

      <TourForm action={updateTour.bind(null, id)} tour={tour} />
    </div>
  );
}
