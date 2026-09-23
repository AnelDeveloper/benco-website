import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
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
      <p className="mb-6 text-slate-600">Faze i slike dodajete nakon što sačuvate.</p>
      <ProjectForm action={createProject} submitLabel="Kreiraj" />
    </div>
  );
}
