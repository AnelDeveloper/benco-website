import Link from 'next/link';
import type { Metadata } from 'next';
import { Building2, Home, LayoutDashboard, BarChart3, LogOut, CalendarDays, Inbox, Car } from 'lucide-react';
import { requireAdmin } from '@/lib/auth/admin';
import { MobileNav } from '@/components/admin/MobileNav';
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
      <div className="flex min-h-screen">
        {/* Desktop sidebar. On phones navigation lives in the bottom bar. */}
        <aside className="hidden w-60 shrink-0 flex-col bg-slate-900 text-slate-300 md:flex">
          <div className="border-b border-slate-800 px-5 py-5">
            <Link href="/admin" className="text-lg font-bold text-white">
              Ben&amp;Co <span className="text-gold-500">Admin</span>
            </Link>
          </div>

          <nav className="flex flex-col gap-1 p-3">
            {NAV.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition hover:bg-slate-800 hover:text-white"
              >
                <Icon size={17} />
                {label}
              </Link>
            ))}
          </nav>

          <div className="mt-auto border-t border-slate-800 p-3">
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

        <div className="flex min-w-0 flex-1 flex-col">
          {/* Mobile header — keeps the brand visible and the page anchored. */}
          <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur-md md:hidden">
            <Link href="/admin" className="text-base font-bold text-slate-900">
              Ben&amp;Co <span className="text-gold-600">Admin</span>
            </Link>
          </header>

          {/* pb-24 clears the fixed bottom bar so nothing hides behind it. */}
          <main className="min-w-0 flex-1 p-4 pb-24 md:p-8 md:pb-8">{children}</main>
        </div>
      </div>

      <MobileNav email={admin.email} signOut={signOut} />
    </div>
  );
}
