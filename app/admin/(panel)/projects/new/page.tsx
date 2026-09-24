import Link from 'next/link';
import { ArrowLeft, ImagePlus, ArrowDown } from 'lucide-react';
import { requireContentAdmin } from '@/lib/auth/admin';
import { ProjectForm } from '@/components/admin/ProjectForm';
import { createProject } from '@/app/admin/_actions/projects';

export default async function NewProjectPage() {
  await requireContentAdmin();
  return (
    <div className="max-w-4xl">
      <Link href="/admin/projects" className="mb-4 inline-flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900">
        <ArrowLeft size={15} /> Nazad na projekte
      </Link>
      <h1 className="mb-1 text-2xl font-bold text-slate-900">Novi projekat</h1>

      <div className="mb-6 flex items-start gap-3 rounded-xl border border-dashed border-slate-300 bg-white p-4">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-400">
          <ImagePlus size={20} />
        </span>
        <div>
          <p className="font-medium text-slate-900">Faze i slike dodajete odmah nakon spremanja</p>
          <p className="mt-0.5 text-sm text-slate-600">
            Popunite podatke i kliknite <strong>Kreiraj</strong> <ArrowDown size={13} className="inline" /> —
            odmah zatim otvara se stranica za ostalo.
          </p>
        </div>
      </div>

      <ProjectForm action={createProject} submitLabel="Kreiraj" />
    </div>
  );
}
