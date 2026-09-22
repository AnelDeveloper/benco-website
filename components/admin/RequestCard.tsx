'use client';

import { useState } from 'react';
import { StickyNote } from 'lucide-react';
import { setRequestStatus, saveRequestNote } from '@/app/admin/_actions/requests';
import { formatDate } from '@/lib/format';
import type { RequestRow, RequestStatus } from '@/lib/supabase/types';

const STATUS_STYLE: Record<RequestStatus, string> = {
  new: 'bg-blue-100 text-blue-700',
  contacted: 'bg-amber-100 text-amber-700',
  confirmed: 'bg-green-100 text-green-700',
  rejected: 'bg-slate-100 text-slate-600',
};

export function RequestCard({
  request,
  kindLabel,
  statusLabels,
  children,
}: {
  request: RequestRow;
  subject: string;
  kindLabel: string;
  statusLabels: Record<RequestStatus, string>;
  children: React.ReactNode;
}) {
  const [notesOpen, setNotesOpen] = useState(Boolean(request.admin_notes));
  const saveNote = saveRequestNote.bind(null, request.id);

  return (
    <li className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-semibold text-slate-900">{request.name}</h2>
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
              {kindLabel}
            </span>
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLE[request.status]}`}>
              {statusLabels[request.status]}
            </span>
          </div>
          {children}
          {request.message && (
            <p className="mt-2 rounded-lg bg-slate-50 p-3 text-sm text-slate-700">{request.message}</p>
          )}
        </div>

        <div className="flex flex-col items-end gap-2">
          <span className="text-xs text-slate-400">
            {formatDate(request.created_at)}
          </span>
          <div className="flex flex-wrap justify-end gap-1.5">
            {(Object.keys(statusLabels) as RequestStatus[])
              .filter((status) => status !== request.status)
              .map((status) => (
                <form key={status} action={setRequestStatus.bind(null, request.id, status)}>
                  <button
                    type="submit"
                    className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs text-slate-700 transition hover:bg-slate-100"
                  >
                    {statusLabels[status]}
                  </button>
                </form>
              ))}
          </div>
          <button
            type="button"
            onClick={() => setNotesOpen((open) => !open)}
            className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800"
          >
            <StickyNote size={13} /> Bilješka
          </button>
        </div>
      </div>

      {notesOpen && (
        <form action={saveNote} className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
          <textarea
            name="admin_notes"
            defaultValue={request.admin_notes ?? ''}
            rows={2}
            placeholder="Privatna bilješka — ne vidi je klijent."
            className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <button
            type="submit"
            className="self-start rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
          >
            Sačuvaj
          </button>
        </form>
      )}
    </li>
  );
}
