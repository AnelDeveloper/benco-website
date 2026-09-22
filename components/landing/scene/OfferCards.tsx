'use client';

import { useDrawer } from '../DrawerContext';
import { formatNumber } from '@/lib/format';

export type OfferProject = {
  id: string;
  title: string;
  location: string;
  image: string | null;
  currency: string;
  pricePerM2: number | null;
  minInvestment: number | null;
  expectedReturnPercent: number | null;
  availableUnits: number | null;
  totalUnits: number | null;
  fundingGoal: number | null;
  fundedAmount: number;
  offersOffplan: boolean;
  offersInvestment: boolean;
};

export function OfferCards({
  project,
  labels,
}: {
  project: OfferProject;
  labels: {
    offplanTitle: string; units: string; reserveUnit: string;
    investTitle: string; expectedReturn: string; investFrom: string; perM2: string;
  };
}) {
  const { open } = useDrawer();

  const item = {
    id: project.id,
    title: project.title,
    subtitle: project.location,
    image: project.image,
    currency: project.currency,
    pricePerM2: project.pricePerM2,
    minInvestment: project.minInvestment,
    expectedReturnPercent: project.expectedReturnPercent,
    availableUnits: project.availableUnits,
    totalUnits: project.totalUnits,
  };

  const funded =
    project.fundingGoal && project.fundingGoal > 0
      ? Math.min(100, (project.fundedAmount / project.fundingGoal) * 100)
      : null;

  return (
    <div className="grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(150px,1fr))]">
      {project.offersOffplan && (
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-dark">
            {labels.offplanTitle}
          </p>
          <p className="mt-1.5 font-display text-2xl text-white">{labels.perM2}</p>
          {labels.units && <p className="mt-1 text-[13px] text-muted-dark">{labels.units}</p>}
          <button
            type="button"
            onClick={() => open('offplan', item)}
            className="mt-4 h-[42px] w-full rounded-xl bg-gold-accent text-sm font-semibold text-[#1a1200] transition hover:bg-gold-hover"
          >
            {labels.reserveUnit}
          </button>
        </div>
      )}

      {project.offersInvestment && (
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-dark">
            {labels.investTitle}
          </p>
          <p className="mt-1.5 font-display text-2xl text-white">
            {project.expectedReturnPercent ?? 0}% <span className="text-base text-muted-dark">{labels.expectedReturn}</span>
          </p>

          {funded !== null && (
            <>
              <p className="mt-2 text-[12px] text-muted-dark">
                {formatNumber(project.fundedAmount)} / {formatNumber(project.fundingGoal)} {project.currency}
              </p>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-gold-deep to-gold-accent"
                  style={{ width: `${funded}%`, transition: 'width 1.4s cubic-bezier(.2,.7,.2,1)' }}
                />
              </div>
            </>
          )}

          <button
            type="button"
            onClick={() => open('invest', item)}
            className="mt-4 h-[42px] w-full rounded-xl border border-white/25 text-sm font-semibold text-white transition hover:bg-white/10"
          >
            {labels.investFrom} {formatNumber(project.minInvestment)} {project.currency}
          </button>
        </div>
      )}
    </div>
  );
}
