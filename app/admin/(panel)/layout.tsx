import Link from 'next/link';
import type { Metadata } from 'next';
import { Building2, Home, LayoutDashboard, BarChart3, LogOut, CalendarDays, Inbox, Car } from 'lucide-react';
import { requireAdmin } from '@/lib/auth/admin';
import { signOut } from '../_actions/auth';

export const metadata: Metadata = {
  title: 'Admin',
  robots: { index: false, follow: false },
};

const NAV = [
  { href: '/admin', label: 'Pregled', icon: LayoutDashboard },
  { href: '/admin/properties', label: 'Nekretnine', icon: Home },
  { href: '/admin/projects', label: 'Projekti', icon: Building2 },
  { href: '/admin/tours', label: 'Ture', icon: Car },
  { href: '/admin/reservations', label: 'Rezervacije', icon: CalendarDays },
  { href: '/admin/requests', label: 'Upiti', icon: Inbox },
  { href: '/admin/stats', label: 'Statistika', icon: BarChart3 },
];

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="flex min-h-screen flex-col md:flex-row">
        <aside className="w-full shrink-0 bg-slate-900 text-slate-300 md:w-60">
          <div className="border-b border-slate-800 px-5 py-5">
            <Link href="/admin" className="text-lg font-bold text-white">
              Ben&amp;Co <span className="text-gold-500">Admin</span>
            </Link>
          </div>

          <nav className="flex flex-row gap-1 overflow-x-auto p-3 md:flex-col">
            {NAV.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-2.5 whitespace-nowrap rounded-lg px-3 py-2 text-sm transition hover:bg-slate-800 hover:text-white"
              >
                <Icon size={17} />
                {label}
              </Link>
            ))}
          </nav>

          <div className="mt-auto hidden border-t border-slate-800 p-3 md:block">
            <p className="truncate px-3 pb-2 text-xs text-slate-500">{admin.email}</p>
            <form action={signOut}>
              <button
                type="submit"
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition hover:bg-slate-800 hover:text-white"
              >
                <LogOut size={17} />
                Odjava
              </button>
            </form>
          </div>
        </aside>

        <main className="flex-1 p-5 md:p-8">{children}</main>
      </div>
    </div>
  );
}
