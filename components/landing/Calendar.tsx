'use client';

import { useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export type Occupied = { from: string; to: string };

const DAY_LABELS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

export function toISO(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

/** Monday-first grid of the given month, padded with nulls. */
function monthGrid(month: Date): (Date | null)[] {
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const lead = (first.getDay() + 6) % 7; // Sunday is 0; shift so Monday leads
  const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();

  const cells: (Date | null)[] = Array(lead).fill(null);
  for (let d = 1; d <= days; d += 1) {
    cells.push(new Date(month.getFullYear(), month.getMonth(), d));
  }
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

export function Calendar({
  mode,
  month,
  onMonthChange,
  from,
  to,
  onPick,
  occupied = [],
  monthLabel,
}: {
  mode: 'range' | 'single';
  month: Date;
  onMonthChange: (next: Date) => void;
  from: string | null;
  to: string | null;
  onPick: (iso: string) => void;
  occupied?: Occupied[];
  monthLabel: string;
}) {
  const cells = useMemo(() => monthGrid(month), [month]);
  const todayISO = toISO(new Date());

  const occupiedSet = useMemo(() => {
    const set = new Set<string>();
    for (const range of occupied) {
      const start = new Date(`${range.from}T00:00:00`);
      const end = new Date(`${range.to}T00:00:00`);
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        set.add(toISO(d));
      }
    }
    return set;
  }, [occupied]);

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <button
          type="button"
          aria-label="←"
          onClick={() => onMonthChange(new Date(month.getFullYear(), month.getMonth() - 1, 1))}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-ink-2 transition hover:bg-paper-3"
        >
          <ChevronLeft size={17} />
        </button>
        <span className="text-sm font-semibold text-ink-2">{monthLabel}</span>
        <button
          type="button"
          aria-label="→"
          onClick={() => onMonthChange(new Date(month.getFullYear(), month.getMonth() + 1, 1))}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-ink-2 transition hover:bg-paper-3"
        >
          <ChevronRight size={17} />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center">
        {DAY_LABELS.map((label) => (
          <span key={label} className="py-1 text-[11px] font-semibold uppercase tracking-wider text-muted">
            {label}
          </span>
        ))}

        {cells.map((date, index) => {
          if (!date) return <span key={`pad-${index}`} className="h-[38px]" />;

          const iso = toISO(date);
          const isPast = iso < todayISO;
          const isOccupied = occupiedSet.has(iso);
          const disabled = isPast || isOccupied;

          const isStart = iso === from;
          const isEnd = iso === to;
          const inBetween = mode === 'range' && from && to && iso > from && iso < to;

          let style = 'text-ink-2 hover:bg-paper-3';
          if (disabled) style = 'text-[#c4c9d2] line-through cursor-not-allowed hover:bg-transparent';
          if (inBetween) style = 'bg-[#f3e4c4] text-ink-2';
          if (isStart || isEnd) style = 'bg-ink-2 text-white';

          const corners =
            mode === 'range' && from && to
              ? isStart
                ? 'rounded-l-[10px] rounded-r-none'
                : isEnd
                  ? 'rounded-r-[10px] rounded-l-none'
                  : inBetween
                    ? 'rounded-none'
                    : 'rounded-[10px]'
              : 'rounded-[10px]';

          return (
            <button
              key={iso}
              type="button"
              disabled={disabled}
              onClick={() => onPick(iso)}
              className={`h-[38px] text-sm font-medium transition ${style} ${corners}`}
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}
