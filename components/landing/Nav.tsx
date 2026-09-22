'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/routing';
import { useParams } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import { useDrawer, type DrawerItem } from './DrawerContext';

const LINKS = ['stays', 'invest', 'tours', 'about', 'contact'] as const;

export function Nav({ bookItem }: { bookItem: DrawerItem | null }) {
  const t = useTranslations('landing.nav');
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { open } = useDrawer();

  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const locale = params.locale as string;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const ghost =
    'h-[38px] rounded-full border border-white/[0.22] bg-transparent text-white transition hover:bg-white/10';

  return (
    <nav
      className="fixed inset-x-0 top-0 z-[60] border-b backdrop-blur-[14px] transition-[background,box-shadow] duration-[400ms]"
      style={{
        background: scrolled ? 'rgba(11,18,32,.82)' : 'transparent',
        borderBottomColor: scrolled ? 'rgba(255,255,255,.08)' : 'transparent',
      }}
    >
      <div className="mx-auto flex h-[72px] max-w-container items-center justify-between gap-4 px-6">
        <a href="#top" className="flex items-center gap-3">
          <Image src="/benco-logo.jpg" alt="Ben&Co" width={40} height={40} className="h-10 w-10 rounded-lg object-cover" />
          <span className="text-xl font-semibold tracking-[0.14em] text-white">
            BEN<span className="text-gold-accent">&amp;</span>CO
          </span>
        </a>

        <div className="hidden items-center gap-7 text-sm font-medium text-white/[0.78] min-[1000px]:flex">
          {LINKS.map((key) => (
            <a key={key} href={`#${key}`} className="transition hover:text-white">
              {t(key)}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => router.replace(pathname, { locale: locale === 'bs' ? 'en' : 'bs' })}
            className={`${ghost} px-3 text-[13px] font-medium tracking-[0.06em]`}
          >
            {locale.toUpperCase()}
          </button>

          {bookItem && (
            <button
              type="button"
              onClick={() => open('stay', bookItem)}
              className="h-[38px] rounded-full bg-gold-accent px-[18px] text-sm font-semibold text-[#1a1200] transition hover:bg-gold-hover"
            >
              {t('book')}
            </button>
          )}

          <button
            type="button"
            aria-label={t('menu')}
            onClick={() => setMenuOpen((v) => !v)}
            className={`${ghost} flex w-[38px] items-center justify-center min-[1000px]:hidden`}
          >
            {menuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="flex flex-col gap-1 border-t border-white/[0.08] bg-[rgba(11,18,32,.96)] px-6 pb-5 pt-3 min-[1000px]:hidden">
          {LINKS.map((key) => (
            <a
              key={key}
              href={`#${key}`}
              onClick={() => setMenuOpen(false)}
              className="border-b border-white/[0.06] px-1 py-3.5 text-lg font-medium text-white"
            >
              {t(key)}
            </a>
          ))}
        </div>
      )}
    </nav>
  );
}
