import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { requireContentAdmin } from '@/lib/auth/admin';
import { createAdminClient } from '@/lib/supabase/admin';
import { ProjectForm } from '@/components/admin/ProjectForm';
import { MilestoneEditor } from '@/components/admin/MilestoneEditor';
import { ImageManager } from '@/components/admin/ImageManager';
import { DeleteButton } from '@/components/admin/DeleteButton';
import { updateProject, deleteProject } from '@/app/admin/_actions/projects';
import type { ProjectMilestoneRow, ProjectImageRow } from '@/lib/supabase/types';

export const dynamic = 'force-dynamic';

export default async function EditProjectPage({ params }: { params: Promise<{ id: string }> }) {
  await requireContentAdmin();
  const { id } = await params;

  const db = createAdminClient();

  // Three queries rather than one nested select: the hand-written schema type
  // carries no relationship metadata, so a join cannot be typed here.
  const [projectResult, milestoneResult, imageResult] = await Promise.all([
    db.from('projects').select('*').eq('id', id).maybeSingle(),
    db.from('project_milestones').select('*').eq('project_id', id).order('sort_order'),
    db.from('project_images').select('*').eq('project_id', id).order('sort_order'),
  ]);

  const project = projectResult.data;
  if (!project) notFound();

  const milestones = (milestoneResult.data ?? []) as ProjectMilestoneRow[];
  const images = (imageResult.data ?? []) as ProjectImageRow[];

  return (
    <div className="max-w-4xl">
      <Link href="/admin/projects" className="mb-4 inline-flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900">
        <ArrowLeft size={15} /> Nazad na projekte
      </Link>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{project.title_bs}</h1>
          <p className="mt-1 text-sm text-slate-500">/{project.slug}</p>
        </div>
        <DeleteButton action={deleteProject.bind(null, id)} />
      </div>

      <div className="space-y-6">
        <MilestoneEditor projectId={id} milestones={milestones} />
        <ImageManager ownerId={id} kind="project" images={images} />
        <ProjectForm action={updateProject.bind(null, id)} project={project} />
      </div>
    </div>
  );
}
