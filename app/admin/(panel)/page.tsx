import Link from 'next/link';
import { Building2, Home, Plus, Inbox, CalendarDays, Lock } from 'lucide-react';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdmin, CAN, ROLE_LABEL } from '@/lib/auth/admin';

/** Only counts the caller is allowed to see are fetched. */
async function counts(canContent: boolean, canCustomers: boolean) {
  const db = createAdminClient();
  const today = new Date().toISOString().slice(0, 10);

  const [properties, published, projects, newRequests, upcoming] = await Promise.all([
    canContent ? db.from('properties').select('*', { count: 'exact', head: true }) : null,
    canContent ? db.from('properties').select('*', { count: 'exact', head: true }).eq('is_published', true) : null,
    canContent ? db.from('projects').select('*', { count: 'exact', head: true }) : null,
    canCustomers ? db.from('requests').select('*', { count: 'exact', head: true }).eq('status', 'new') : null,
    canCustomers
      ? db.from('reservations').select('*', { count: 'exact', head: true })
          .eq('status', 'confirmed').gte('created_at', `${today}T00:00:00Z`)
      : null,
  ]);

  return {
    properties: properties?.count ?? 0,
    published: published?.count ?? 0,
    projects: projects?.count ?? 0,
    newRequests: newRequests?.count ?? 0,
    upcoming: upcoming?.count ?? 0,
  };
}

export default async function DashboardPage() {
  const admin = await requireAdmin();
  const can = CAN[admin.role];

  // A parked account can sign in but has nothing to do yet — say so plainly
  // rather than showing an empty panel that looks broken.
  if (!can.content && !can.customers) {
    return (
      <div className="mx-auto max-w-md pt-10 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-slate-200">
          <Lock size={24} className="text-slate-500" />
        </div>
        <h1 className="text-xl font-bold text-slate-900">Nemate pristup</h1>
        <p className="mt-2 text-slate-600">
          Vaš nalog je kreiran, ali vam još nije dodijeljena uloga. Javite se administratoru
          da vam odobri pristup.
        </p>
        <p className="mt-4 text-sm text-slate-500">{admin.email} · {ROLE_LABEL[admin.role]}</p>
      </div>
    );
  }

  const { properties, published, projects, newRequests, upcoming } = await counts(can.content, can.customers);

  const cards = [
    can.customers && { label: 'Novi upiti', value: newRequests, sub: 'čeka odgovor', href: '/admin/requests', icon: Inbox },
    can.customers && { label: 'Rezervacije danas', value: upcoming, sub: 'novih danas', href: '/admin/reservations', icon: CalendarDays },
    can.content && { label: 'Nekretnine', value: properties, sub: `${published} objavljeno`, href: '/admin/properties', icon: Home },
    can.content && { label: 'Projekti', value: projects, sub: 'u ponudi', href: '/admin/projects', icon: Building2 },
  ].filter(Boolean) as { label: string; value: number; sub: string; href: string; icon: typeof Home }[];

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Pregled</h1>
      <p className="mt-1 text-slate-600">
        Dobrodošli nazad · <span className="text-gold-600">{ROLE_LABEL[admin.role]}</span>
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map(({ label, value, sub, href, icon: Icon }) => (
          <Link
            key={label}
            href={href}
            className="rounded-xl border border-slate-200 bg-white p-5 transition hover:border-gold-500 hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-600">{label}</span>
              <Icon size={18} className="text-gold-600" />
            </div>
            <p className="mt-2 text-3xl font-bold text-slate-900">{value}</p>
            <p className="mt-1 text-sm text-slate-500">{sub}</p>
          </Link>
        ))}
      </div>

      {can.content && properties === 0 && (
        <div className="mt-6 rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center">
          <p className="text-slate-600">Još nema nekretnina.</p>
          <Link
            href="/admin/properties/new"
            className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-lg bg-gold-600 px-4 font-medium text-white transition hover:bg-gold-500"
          >
            <Plus size={17} /> Dodaj prvu nekretninu
          </Link>
        </div>
      )}
    </div>
  );
}
