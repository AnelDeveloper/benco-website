import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { requireContentAdmin } from '@/lib/auth/admin';
import { PropertyForm } from '@/components/admin/PropertyForm';
import { createProperty } from '@/app/admin/_actions/properties';

export default async function NewPropertyPage() {
  await requireContentAdmin();

  return (
    <div className="max-w-4xl">
      <Link href="/admin/properties" className="mb-4 inline-flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900">
        <ArrowLeft size={15} /> Nazad na nekretnine
      </Link>
      <h1 className="mb-1 text-2xl font-bold text-slate-900">Nova nekretnina</h1>
      <p className="mb-6 text-slate-600">Slike dodajete nakon što sačuvate.</p>
      <PropertyForm action={createProperty} submitLabel="Kreiraj" />
    </div>
  );
}
