import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { requireAdmin } from '@/lib/auth/admin';
import { TourForm } from '@/components/admin/TourForm';
import { createTour } from '@/app/admin/_actions/tours';

export default async function NewTourPage() {
  await requireAdmin();
  return (
    <div className="max-w-4xl">
      <Link href="/admin/tours" className="mb-4 inline-flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900">
        <ArrowLeft size={15} /> Nazad na ture
      </Link>
      <h1 className="mb-6 text-2xl font-bold text-slate-900">Nova tura</h1>
      <TourForm action={createTour} submitLabel="Kreiraj" />
    </div>
  );
}
