import type { ReactNode } from 'react';

/**
 * Display heading: Instrument Serif with one italic gold phrase.
 *
 * The emphasis sits mid-sentence, so the copy is split into three translation
 * keys rather than embedded markup — translators move the emphasis where the
 * sentence needs it without touching code.
 */
export function Display({
  before,
  em,
  after,
  as: Tag = 'h2',
  size = 'section',
  className = '',
  emClassName = 'text-gold-accent',
}: {
  before: string;
  em: string;
  after?: string;
  as?: 'h1' | 'h2' | 'h3';
  size?: 'hero' | 'section';
  className?: string;
  emClassName?: string;
}) {
  const sizing =
    size === 'hero'
      ? 'text-[clamp(46px,7.2vw,96px)] leading-[0.98]'
      : 'text-[clamp(36px,4.6vw,60px)] leading-[1.02]';

  return (
    <Tag className={`font-display font-normal tracking-[-0.02em] text-balance ${sizing} ${className}`}>
      {before}
      <em className={`italic ${emClassName}`}>{em}</em>
      {after}
    </Tag>
  );
}

/** Small uppercase label above a heading. */
export function Kicker({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <p className={`text-[12px] font-semibold uppercase tracking-[0.22em] ${className}`}>{children}</p>
  );
}
