import Link from 'next/link';
import { Plus, Pencil } from 'lucide-react';
import { requireContentAdmin } from '@/lib/auth/admin';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

const STATUS_LABEL: Record<string, string> = {
  planning: 'U pripremi',
  under_construction: 'U izgradnji',
  completed: 'Završeno',
};

export default async function ProjectsPage() {
  await requireContentAdmin();
  const db = createAdminClient();
  const { data } = await db.from('projects').select('*').order('sort_order');
  const projects = data ?? [];

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Projekti</h1>
          <p className="mt-1 text-slate-600">{projects.length} ukupno</p>
        </div>
        <Link
          href="/admin/projects/new"
          className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-gold-600 px-4 font-semibold text-white transition hover:bg-gold-500"
        >
          <Plus size={18} /> Dodaj projekat
        </Link>
      </div>

      {projects.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-600">
          Još nema projekata.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {projects.map((project) => (
            <Link
              key={project.id}
              href={`/admin/projects/${project.id}`}
              className="rounded-xl border border-slate-200 bg-white p-5 transition hover:border-gold-500 hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-semibold text-slate-900">{project.title_bs}</h2>
                  <p className="text-sm text-slate-500">{project.location}</p>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1 text-xs text-slate-600">
                  <Pencil size={12} /> Uredi
                </span>
              </div>

              <div className="mt-4">
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="text-slate-600">{STATUS_LABEL[project.status]}</span>
                  <span className="font-semibold text-gold-600">{project.progress_percent}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-gold-500" style={{ width: `${project.progress_percent}%` }} />
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                {project.is_published ? (
                  <span className="rounded-full bg-green-100 px-2 py-0.5 text-green-700">Objavljeno</span>
                ) : (
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-600">Skica</span>
                )}
                {project.offers_offplan && (
                  <span className="rounded-full bg-blue-50 px-2 py-0.5 text-blue-700">Kupovina u izgradnji</span>
                )}
                {project.offers_investment && (
                  <span className="rounded-full bg-amber-50 px-2 py-0.5 text-amber-700">Ulaganje</span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
