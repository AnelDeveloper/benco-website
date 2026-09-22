'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Phone, Mail, MapPin, Clock, Loader2 } from 'lucide-react';
import { Display, Kicker } from './Display';

const DETAILS = [
  { key: 'phone', icon: Phone, value: '+387 62 266 662', href: 'tel:+38762266662' },
  { key: 'email', icon: Mail, value: 'realestatebenco@gmail.com', href: 'mailto:realestatebenco@gmail.com' },
  { key: 'office', icon: MapPin, value: 'Gajev Trg 4, Sarajevo', href: null },
  { key: 'hours', icon: Clock, value: 'Mon – Sat, 09:00 – 17:00', href: null },
] as const;

const inputClass =
  'h-12 w-full rounded-xl border border-white/[0.14] bg-[rgba(11,18,32,.6)] px-3.5 text-[15px] text-white outline-none transition placeholder:text-white/40 focus:border-gold-accent';

export function Contact() {
  const t = useTranslations('landing.contact');
  const [status, setStatus] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setStatus('sending');

    const response = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: form.get('name'),
        email: form.get('email'),
        phone: form.get('phone'),
        message: form.get('message'),
      }),
    });

    setStatus(response.ok ? 'done' : 'error');
  }

  return (
    <section id="contact" className="bg-paper pb-28">
      <div className="mx-auto max-w-container px-6">
        <div className="grid gap-10 rounded-panel bg-ink p-[clamp(28px,5vw,56px)] lg:grid-cols-2">
          <div>
            <Kicker className="mb-3 text-gold-accent">{t('kicker')}</Kicker>
            <Display before={t('titleA')} em={t('titleEm')} after={t('titleB')} className="text-white" />
            <p className="mt-4 text-[17px] text-white/70">{t('sub')}</p>

            <ul className="mt-8 space-y-4">
              {DETAILS.map(({ key, icon: Icon, value, href }) => (
                <li key={key} className="flex items-center gap-3.5">
                  <span className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-xl bg-gold-accent/15">
                    <Icon size={17} className="text-gold-accent" />
                  </span>
                  <span>
                    <span className="block text-[12px] uppercase tracking-[0.14em] text-muted-dark">{t(key)}</span>
                    {href ? (
                      <a href={href} className="block text-[15px] text-white transition hover:text-gold-accent">{value}</a>
                    ) : (
                      <span className="block text-[15px] text-white">{value}</span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <form onSubmit={submit} className="space-y-3">
            {status === 'done' && (
              <p className="rounded-xl bg-[#e8f7ee] px-3.5 py-3 text-sm text-[#166534]">{t('success')}</p>
            )}
            {status === 'error' && (
              <p role="alert" className="rounded-xl bg-red-500/15 px-3.5 py-3 text-sm text-red-300">{t('error')}</p>
            )}

            <div className="grid gap-3 sm:grid-cols-2">
              <input name="name" required placeholder={t('name')} className={inputClass} />
              <input name="phone" type="tel" placeholder={t('phone')} className={inputClass} />
            </div>
            <input name="email" type="email" required placeholder={t('email')} className={inputClass} />
            <textarea name="message" required rows={5} placeholder={t('message')} className={`${inputClass} h-auto py-3`} />

            <button
              type="submit"
              disabled={status === 'sending'}
              className="flex h-[50px] w-full items-center justify-center gap-2 rounded-xl bg-gold-accent text-[15px] font-semibold text-[#1a1200] transition hover:bg-gold-hover disabled:opacity-60"
            >
              {status === 'sending' && <Loader2 size={17} className="animate-spin" />}
              {status === 'sending' ? t('sending') : t('send')}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
