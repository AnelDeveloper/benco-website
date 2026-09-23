import Link from 'next/link';
import { Building2, Home, Plus } from 'lucide-react';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdmin } from '@/lib/auth/admin';

async function counts() {
  const db = createAdminClient();
  const [properties, published, projects] = await Promise.all([
    db.from('properties').select('*', { count: 'exact', head: true }),
    db.from('properties').select('*', { count: 'exact', head: true }).eq('is_published', true),
    db.from('projects').select('*', { count: 'exact', head: true }),
  ]);
  return {
    properties: properties.count ?? 0,
    published: published.count ?? 0,
    projects: projects.count ?? 0,
  };
}

export default async function DashboardPage() {
  await requireAdmin();
  const { properties, published, projects } = await counts();

  const cards = [
    { label: 'Nekretnine', value: properties, sub: `${published} objavljeno`, href: '/admin/properties', icon: Home },
    { label: 'Projekti', value: projects, sub: 'u ponudi', href: '/admin/projects', icon: Building2 },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Pregled</h1>
      <p className="mt-1 text-slate-600">Dobrodošli nazad.</p>

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

      {properties === 0 && (
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
