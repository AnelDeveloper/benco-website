'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  LayoutDashboard, Home, CalendarDays, Inbox, MoreHorizontal,
  Building2, Car, BarChart3, LogOut, X,
} from 'lucide-react';

/** The five screens that earn a permanent spot under the thumb. */
const TABS = [
  { href: '/admin', label: 'Pregled', icon: LayoutDashboard, exact: true },
  { href: '/admin/properties', label: 'Nekretnine', icon: Home },
  { href: '/admin/reservations', label: 'Rezervacije', icon: CalendarDays },
  { href: '/admin/requests', label: 'Upiti', icon: Inbox },
];

const MORE = [
  { href: '/admin/projects', label: 'Projekti', icon: Building2 },
  { href: '/admin/tours', label: 'Ture autom', icon: Car },
  { href: '/admin/stats', label: 'Statistika', icon: BarChart3 },
];

function isActive(pathname: string, href: string, exact?: boolean) {
  return exact ? pathname === href : pathname.startsWith(href);
}

export function MobileNav({
  email,
  signOut,
}: {
  email: string;
  signOut: () => Promise<void>;
}) {
  const pathname = usePathname();
  const [sheetOpen, setSheetOpen] = useState(false);

  // Close the sheet when navigating, or it stays open over the new page.
  useEffect(() => setSheetOpen(false), [pathname]);

  const moreActive = MORE.some((item) => pathname.startsWith(item.href));

  return (
    <>
      {sheetOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <button
            type="button"
            aria-label="Zatvori"
            onClick={() => setSheetOpen(false)}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          />

          <div className="absolute inset-x-0 bottom-0 rounded-t-2xl bg-white pb-[env(safe-area-inset-bottom)] shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <p className="truncate text-sm text-slate-500">{email}</p>
              <button
                type="button"
                onClick={() => setSheetOpen(false)}
                aria-label="Zatvori"
                className="flex h-11 w-11 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>

            <nav className="p-2">
              {MORE.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className={`flex min-h-[56px] items-center gap-3 rounded-xl px-4 text-[15px] font-medium transition ${
                    pathname.startsWith(href) ? 'bg-gold-600/10 text-gold-600' : 'text-slate-800 active:bg-slate-100'
                  }`}
                >
                  <Icon size={20} /> {label}
                </Link>
              ))}

              <form action={signOut}>
                <button
                  type="submit"
                  className="flex min-h-[56px] w-full items-center gap-3 rounded-xl px-4 text-[15px] font-medium text-red-600 active:bg-red-50"
                >
                  <LogOut size={20} /> Odjava
                </button>
              </form>
            </nav>
          </div>
        </div>
      )}

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 backdrop-blur-md pb-[env(safe-area-inset-bottom)] md:hidden">
        <div className="grid grid-cols-5">
          {TABS.map(({ href, label, icon: Icon, exact }) => {
            const active = isActive(pathname, href, exact);
            return (
              <Link
                key={href}
                href={href}
                className={`flex min-h-[58px] flex-col items-center justify-center gap-1 text-[11px] font-medium transition ${
                  active ? 'text-gold-600' : 'text-slate-500 active:bg-slate-100'
                }`}
              >
                <Icon size={21} />
                <span className="leading-none">{label}</span>
              </Link>
            );
          })}

          <button
            type="button"
            onClick={() => setSheetOpen(true)}
            className={`flex min-h-[58px] flex-col items-center justify-center gap-1 text-[11px] font-medium transition ${
              moreActive ? 'text-gold-600' : 'text-slate-500 active:bg-slate-100'
            }`}
          >
            <MoreHorizontal size={21} />
            <span className="leading-none">Više</span>
          </button>
        </div>
      </nav>
    </>
  );
}
