import Link from 'next/link';
import { ArrowLeft, ImagePlus, ArrowDown } from 'lucide-react';
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
      <h1 className="mb-6 text-2xl font-bold text-slate-900">Nova nekretnina</h1>

      {/*
        A photo needs a property to belong to, so it cannot be uploaded before
        the row exists. Saying that plainly — instead of simply omitting the
        section — stops the page looking like the upload is missing or broken.
      */}
      <div className="mb-6 flex items-start gap-3 rounded-xl border border-dashed border-slate-300 bg-white p-4">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-400">
          <ImagePlus size={20} />
        </span>
        <div>
          <p className="font-medium text-slate-900">Slike dodajete odmah nakon spremanja</p>
          <p className="mt-0.5 text-sm text-slate-600">
            Popunite podatke i kliknite <strong>Kreiraj</strong> <ArrowDown size={13} className="inline" /> —
            odmah zatim otvara se stranica gdje dodajete fotografije.
          </p>
        </div>
      </div>

      <PropertyForm action={createProperty} submitLabel="Kreiraj" />
    </div>
  );
}
