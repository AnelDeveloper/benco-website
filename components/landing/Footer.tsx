import Image from 'next/image';
import { getTranslations } from 'next-intl/server';
import { Facebook, Instagram, Linkedin } from 'lucide-react';

const SOCIALS = [
  { label: 'Facebook', icon: Facebook, href: 'https://facebook.com' },
  { label: 'Instagram', icon: Instagram, href: 'https://instagram.com' },
  { label: 'LinkedIn', icon: Linkedin, href: 'https://linkedin.com' },
];

export async function Footer() {
  const t = await getTranslations('landing');
  const nav = ['stays', 'invest', 'tours', 'about', 'contact'] as const;

  return (
    <footer className="border-t border-line bg-paper py-12">
      <div className="mx-auto flex max-w-container flex-wrap items-center justify-between gap-8 px-6">
        <div className="flex items-center gap-3">
          <Image src="/benco-logo.jpg" alt="Ben&Co" width={40} height={40} className="h-10 w-10 rounded-lg object-cover" />
          <div>
            <p className="text-lg font-semibold tracking-[0.14em] text-ink-2">
              BEN<span className="text-gold-deep">&amp;</span>CO
            </p>
            <p className="text-[13px] text-muted">{t('footer.tagline')}</p>
          </div>
        </div>

        <nav className="flex flex-wrap gap-6 text-sm text-muted-body">
          {nav.map((key) => (
            <a key={key} href={`#${key}`} className="transition hover:text-ink-2">
              {t(`nav.${key}` as 'nav.stays')}
            </a>
          ))}
        </nav>

        <div className="flex gap-2">
          {SOCIALS.map(({ label, icon: Icon, href }) => (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noreferrer noopener"
              aria-label={label}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-line-2 text-ink-2 transition hover:bg-ink-2 hover:text-white"
            >
              <Icon size={16} />
            </a>
          ))}
        </div>
      </div>

      <p className="mx-auto mt-8 max-w-container px-6 text-xs text-muted">
        © 2026 Ben&amp;Co. All rights reserved.
      </p>
    </footer>
  );
}
