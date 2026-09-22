import Link from 'next/link';
import { Mail, Phone, Banknote, Home, Building2, Car, CalendarDays, Users } from 'lucide-react';
import { requireAdmin } from '@/lib/auth/admin';
import { createAdminClient } from '@/lib/supabase/admin';
import { RequestCard } from '@/components/admin/RequestCard';
import { formatNumber } from '@/lib/format';
import type { RequestKind, RequestRow, RequestStatus } from '@/lib/supabase/types';

export const dynamic = 'force-dynamic';

const KIND_LABEL: Record<string, string> = {
  purchase: 'Ponuda za kupovinu',
  offplan: 'Kupovina u izgradnji',
  investment: 'Ulaganje',
  tour: 'Tura autom',
};

const STATUS_LABEL: Record<RequestStatus, string> = {
  new: 'Novo',
  contacted: 'Kontaktiran',
  confirmed: 'Potvrđeno',
  rejected: 'Odbijeno',
};

export default async function RequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ kind?: string; status?: string }>;
}) {
  await requireAdmin();
  const filters = await searchParams;
  const db = createAdminClient();

  // Query params come from the URL, so narrow them to known values rather than
  // passing whatever was typed straight into the query.
  const KINDS: RequestKind[] = ['purchase', 'offplan', 'investment', 'tour'];
  const STATUSES: RequestStatus[] = ['new', 'contacted', 'confirmed', 'rejected'];

  const kind = KINDS.find((value) => value === filters.kind);
  const status = STATUSES.find((value) => value === filters.status);

  let query = db.from('requests').select('*').order('created_at', { ascending: false });
  if (kind) query = query.eq('kind', kind);
  if (status) query = query.eq('status', status);

  const [requestResult, propertyResult, projectResult, tourResult] = await Promise.all([
    query,
    db.from('properties').select('id, title_bs'),
    db.from('projects').select('id, title_bs'),
    db.from('tours').select('id, title_bs'),
  ]);

  const requests = (requestResult.data ?? []) as RequestRow[];
  const names = new Map<string, string>([
    ...(propertyResult.data ?? []).map((p) => [p.id, p.title_bs] as [string, string]),
    ...(projectResult.data ?? []).map((p) => [p.id, p.title_bs] as [string, string]),
    ...(tourResult.data ?? []).map((p) => [p.id, p.title_bs] as [string, string]),
  ]);

  const chip = (active: boolean) =>
    `rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
      active ? 'bg-gold-600 text-white' : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
    }`;

  const link = (key: 'kind' | 'status', value?: string) => {
    const next = { ...filters, [key]: value } as Record<string, string | undefined>;
    const query = Object.entries(next).filter(([, v]) => v).map(([k, v]) => `${k}=${v}`).join('&');
    return query ? `/admin/requests?${query}` : '/admin/requests';
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Upiti</h1>
      <p className="mb-5 mt-1 text-slate-600">{requests.length} prikazano</p>

      <div className="mb-6 space-y-2">
        <div className="flex flex-wrap gap-2">
          <Link href={link('kind', undefined)} className={chip(!kind)}>Svi tipovi</Link>
          {Object.entries(KIND_LABEL).map(([value, label]) => (
            <Link key={value} href={link('kind', value)} className={chip(kind === value)}>{label}</Link>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={link('status', undefined)} className={chip(!status)}>Svi statusi</Link>
          {(Object.keys(STATUS_LABEL) as RequestStatus[]).map((value) => (
            <Link key={value} href={link('status', value)} className={chip(status === value)}>
              {STATUS_LABEL[value]}
            </Link>
          ))}
        </div>
      </div>

      {requests.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-600">
          Nema upita za ovaj filter.
        </div>
      ) : (
        <ul className="space-y-3">
          {requests.map((request) => {
            const subject =
              names.get(request.property_id ?? request.project_id ?? request.tour_id ?? '') ?? '—';
            const Icon =
              request.kind === 'purchase' ? Home : request.kind === 'tour' ? Car : Building2;

            return (
              <RequestCard
                key={request.id}
                request={request}
                subject={subject}
                kindLabel={KIND_LABEL[request.kind]}
                statusLabels={STATUS_LABEL}
              >
                <p className="flex items-center gap-1.5 text-sm text-slate-600">
                  <Icon size={14} /> {subject}
                </p>
                <p className="flex items-center gap-1.5 text-sm text-slate-600">
                  <Mail size={14} />
                  <a href={`mailto:${request.email}`} className="hover:text-gold-600">{request.email}</a>
                </p>
                {request.phone && (
                  <p className="flex items-center gap-1.5 text-sm text-slate-600">
                    <Phone size={14} />
                    <a href={`tel:${request.phone}`} className="hover:text-gold-600">{request.phone}</a>
                  </p>
                )}
                {request.amount !== null && (
                  <p className="flex items-center gap-1.5 text-sm font-semibold text-slate-800">
                    <Banknote size={14} /> {formatNumber(Number(request.amount))} BAM
                  </p>
                )}
                {request.units !== null && (
                  <p className="text-sm text-slate-600">Broj jedinica: {request.units}</p>
                )}
                {request.tour_date && (
                  <p className="flex items-center gap-1.5 text-sm text-slate-600">
                    <CalendarDays size={14} /> {request.tour_date}
                  </p>
                )}
                {request.seats !== null && (
                  <p className="flex items-center gap-1.5 text-sm text-slate-600">
                    <Users size={14} /> {request.seats} mjesta
                  </p>
                )}
              </RequestCard>
            );
          })}
        </ul>
      )}
    </div>
  );
}
