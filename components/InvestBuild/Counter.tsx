'use client';

import { useEffect, useRef, useState } from 'react';
import { useInView, useReducedMotion } from 'framer-motion';
import { formatNumber } from '@/lib/format';

/**
 * Counts up to `value` the first time it scrolls into view.
 *
 * Renders the final value immediately when motion is reduced or before the
 * effect runs, so the number is never missing — only its animation is optional.
 */
export function Counter({ value, suffix = '' }: { value: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  const reduceMotion = useReducedMotion();
  const [display, setDisplay] = useState(value);

  useEffect(() => {
    if (!inView || reduceMotion) return;

    let frame = 0;
    const duration = 1400;
    const start = performance.now();

    const tick = (now: number) => {
      const elapsed = Math.min(1, (now - start) / duration);
      // easeOutExpo: fast at first, settling gently on the final number
      const eased = elapsed === 1 ? 1 : 1 - Math.pow(2, -10 * elapsed);
      setDisplay(Math.round(value * eased));
      if (elapsed < 1) frame = requestAnimationFrame(tick);
    };

    setDisplay(0);
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [inView, value, reduceMotion]);

  return (
    <span ref={ref}>
      {formatNumber(display)}
      {suffix}
    </span>
  );
}
