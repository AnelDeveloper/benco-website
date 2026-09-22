'use client';

import { useState } from 'react';
import { Trash2 } from 'lucide-react';

/**
 * Two-step delete. Deliberately not window.confirm — a native dialog blocks the
 * page and cannot be styled or tested reliably.
 */
export function DeleteButton({
  action,
  label = 'Obriši',
  confirmLabel = 'Sigurno obriši',
}: {
  action: () => Promise<void>;
  label?: string;
  confirmLabel?: string;
}) {
  const [armed, setArmed] = useState(false);

  if (!armed) {
    return (
      <button
        type="button"
        onClick={() => setArmed(true)}
        className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50"
      >
        <Trash2 size={15} /> {label}
      </button>
    );
  }

  return (
    <span className="inline-flex items-center gap-2">
      <form action={action}>
        <button
          type="submit"
          className="rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-red-500"
        >
          {confirmLabel}
        </button>
      </form>
      <button
        type="button"
        onClick={() => setArmed(false)}
        className="rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-100"
      >
        Odustani
      </button>
    </span>
  );
}
