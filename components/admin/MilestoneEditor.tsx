'use client';

import { Check, Circle, Trash2, Plus } from 'lucide-react';
import { addMilestone, toggleMilestone, deleteMilestone } from '@/app/admin/_actions/projects';
import type { ProjectMilestoneRow } from '@/lib/supabase/types';

export function MilestoneEditor({
  projectId,
  milestones,
}: {
  projectId: string;
  milestones: ProjectMilestoneRow[];
}) {
  const sorted = [...milestones].sort((a, b) => a.sort_order - b.sort_order);
  const add = addMilestone.bind(null, projectId);

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5">
      <h2 className="font-semibold text-slate-900">Faze izgradnje</h2>
      <p className="mb-4 text-sm text-slate-500">
        Prikazuju se na sajtu uz animaciju izgradnje.
      </p>

      {sorted.length === 0 ? (
        <p className="mb-4 rounded-lg border border-dashed border-slate-300 p-5 text-center text-sm text-slate-500">
          Još nema faza.
        </p>
      ) : (
        <ol className="mb-4 space-y-2">
          {sorted.map((milestone) => (
            <li
              key={milestone.id}
              className="flex items-center gap-3 rounded-lg border border-slate-200 px-3 py-2"
            >
              <form action={toggleMilestone.bind(null, milestone.id, !milestone.is_done)}>
                <button
                  type="submit"
                  aria-label={milestone.is_done ? 'Označi kao nezavršeno' : 'Označi kao završeno'}
                  className={
                    milestone.is_done
                      ? 'flex h-6 w-6 items-center justify-center rounded-full bg-green-600 text-white'
                      : 'flex h-6 w-6 items-center justify-center rounded-full border border-slate-300 text-slate-400 hover:border-gold-500'
                  }
                >
                  {milestone.is_done ? <Check size={14} /> : <Circle size={10} />}
                </button>
              </form>

              <span className="flex-1">
                <span className="block text-sm font-medium text-slate-800">{milestone.title_bs}</span>
                <span className="block text-xs text-slate-500">
                  {milestone.title_en}
                  {milestone.target_date ? ` · ${milestone.target_date}` : ''}
                </span>
              </span>

              <form action={deleteMilestone.bind(null, milestone.id)}>
                <button type="submit" aria-label="Obriši fazu" className="rounded p-1.5 text-red-600 hover:bg-red-50">
                  <Trash2 size={15} />
                </button>
              </form>
            </li>
          ))}
        </ol>
      )}

      <form action={add} className="grid gap-2 sm:grid-cols-[1fr_1fr_150px_auto]">
        <input name="title_bs" placeholder="Naziv faze (BS)" required className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        <input name="title_en" placeholder="Naziv faze (EN)" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        <input name="target_date" type="date" className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        <button
          type="submit"
          className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
        >
          <Plus size={15} /> Dodaj
        </button>
      </form>
    </section>
  );
}
