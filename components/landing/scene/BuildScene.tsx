'use client';

import { useEffect, useRef, useState } from 'react';
import { useScroll, useMotionValueEvent, useReducedMotion, useInView } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { computeScene, stageIndex, STARS, BACK, MID, FLOOR_START } from './math';

export type SceneStage = { title: string; date: string | null; isDone: boolean };

export function BuildScene({
  floorCount,
  stages,
  progressPercent,
  completion,
  panel,
}: {
  floorCount: number;
  stages: SceneStage[];
  progressPercent: number;
  completion: string | null;
  panel: React.ReactNode;
}) {
  const t = useTranslations('landing.build');
  const wrapRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  const [p, setP] = useState(1); // finished until the client says otherwise
  const ringInView = useInView(ringRef, { once: true, margin: '-80px' });

  useEffect(() => setMounted(true), []);

  const { scrollYProgress } = useScroll({
    target: wrapRef,
    offset: ['start start', 'end end'],
  });

  const animate = mounted && !reduceMotion;

  // Coalesce to one state update per animation frame. Scroll events fire far
  // more often than frames, and a React render per event makes the scene
  // stutter — only the newest value matters.
  const pending = useRef<number | null>(null);
  const frame = useRef(0);

  useMotionValueEvent(scrollYProgress, 'change', (value) => {
    if (!animate) return;
    pending.current = value;
    if (frame.current) return;
    frame.current = requestAnimationFrame(() => {
      frame.current = 0;
      if (pending.current !== null) setP(pending.current);
    });
  });

  useEffect(() => () => { if (frame.current) cancelAnimationFrame(frame.current); }, []);

  // Before mount and under reduced motion the scene is finished and at night.
  useEffect(() => {
    if (!animate) setP(1);
  }, [animate]);

  const s = computeScene(animate ? p : 1, floorCount);
  const active = stageIndex(animate ? p : 1, stages.length);

  const phaseLabel = [
    t('phasePrepared'),
    t('phaseFoundation'),
    t('phaseFloor', { n: Math.min(s.n, s.activeFloor + 1), total: s.n }),
    t('phaseRoof'),
    t('phaseLights'),
    t('phaseDone'),
  ][s.phase];

  const hint = !animate || p >= 0.98
    ? t('hintComplete')
    : p < 0.02 ? t('hintScroll') : `${Math.round(p * 100)}%`;

  const ringLength = 251.3;

  return (
    <div ref={wrapRef} style={{ height: animate ? '360vh' : 'auto' }}>
      <div className={animate ? 'sticky top-0 flex min-h-screen items-center' : ''}>
        <div className="mx-auto grid w-full max-w-container gap-8 px-6 pb-10 pt-[88px] lg:grid-cols-2">
          {/* Scene */}
          <div className="relative overflow-hidden rounded-panel shadow-scene">
            <svg viewBox="0 0 640 520" className="block aspect-[640/520] w-full" role="img" aria-label="Construction">
              <defs>
                <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={s.sky.top} />
                  <stop offset="100%" stopColor={s.sky.bottom} />
                </linearGradient>
                <linearGradient id="groundGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={s.sky.ground} />
                  <stop offset="100%" stopColor={s.sky.groundDeep} />
                </linearGradient>
                <radialGradient id="sunGlow">
                  <stop offset="0%" stopColor="#ffd9a0" stopOpacity="0.5" />
                  <stop offset="100%" stopColor="#ffd9a0" stopOpacity="0" />
                </radialGradient>
              </defs>

              <rect width="640" height="520" fill="url(#skyGrad)" />

              <g opacity={s.sky.stars}>
                {STARS.map((star, i) => (
                  <circle
                    key={i}
                    cx={star.x}
                    cy={star.y}
                    r={star.r}
                    fill="#fff"
                    style={animate ? { animation: `twinkle ${star.dur}s ease-in-out ${star.delay}s infinite` } : undefined}
                  />
                ))}
              </g>

              <g opacity={s.sun.o}>
                <circle cx={s.sun.x} cy={s.sun.y} r={70} fill="url(#sunGlow)" />
                <circle cx={s.sun.x} cy={s.sun.y} r={22} fill="#ffd9a0" />
              </g>

              <g opacity={s.moon.o}>
                <circle cx={s.moon.x} cy={s.moon.y} r={16} fill="#eef2ff" />
                <circle cx={s.moon.x2} cy={s.moon.y2} r={13} fill={s.sky.top} />
              </g>

              <g transform={`translate(${s.skyline.backX} 0)`} fill={s.sky.back}>
                {BACK.map((r, i) => <rect key={i} x={r.x} y={r.y} width={r.w} height={r.h} />)}
              </g>
              <g transform={`translate(${s.skyline.midX} 0)`} fill={s.sky.mid}>
                {MID.map((r, i) => <rect key={i} x={r.x} y={r.y} width={r.w} height={r.h} />)}
              </g>

              <rect x="0" y="372" width="640" height="148" fill="url(#groundGrad)" />
              <ellipse cx="336" cy="384" rx="160" ry="40" fill="#000" opacity={0.25 + 0.2 * s.built} />
              <ellipse cx="336" cy="392" rx="180" ry="46" fill="#f2b544" opacity={(animate ? Math.max(0, (p - 0.8) / 0.2) : 1) * 0.14} />

              {/* crane behind the building */}
              <g opacity={s.crane.opacity} transform={`translate(0 ${s.crane.rise})`}>
                <rect x={s.crane.x} y={s.crane.top} width="7" height={s.crane.h} fill="#f2b544" />
                {s.crane.rungs.map((y) => (
                  <line key={y} x1={s.crane.x} y1={y} x2={s.crane.x2} y2={y - 8} stroke="#0b1220" strokeOpacity="0.35" strokeWidth="1.5" />
                ))}
                <g transform={`rotate(${s.crane.angle} ${s.crane.pivotX} ${s.crane.jibY})`}>
                  <rect x={s.crane.jibX} y={s.crane.jibY} width={s.crane.jibW} height="5" fill="#f2b544" />
                  <rect x={s.crane.cwX} y={s.crane.jibY - 5} width="26" height="14" fill="#c98a1c" />
                  <rect x={s.crane.cabX} y={s.crane.cabY} width="16" height="12" fill="#1a1f2b" />
                  <line x1={s.crane.hookX} y1={s.crane.jibY + 5} x2={s.crane.hookX} y2={s.crane.hookY} stroke="#d1d5db" strokeWidth="1.5" />
                  {s.crane.loadVisible && (
                    <rect x={s.crane.loadX} y={s.crane.hookY} width="26" height="7" rx="1" fill="#c9c0b0" />
                  )}
                </g>
              </g>

              {/* foundation */}
              <g opacity={s.foundation.opacity} transform={`translate(0 ${s.foundation.y})`}>
                <polygon points={s.foundation.left} fill="#4d525b" />
                <polygon points={s.foundation.right} fill="#3a3f47" />
                <polygon points={s.foundation.top} fill="#6b6f77" />
              </g>

              {/* floors */}
              {s.floors.map((floor, i) => (
                <g key={i} opacity={floor.opacity} transform={`translate(0 ${floor.y})`}>
                  <polygon points={floor.left} fill={floor.leftFill} />
                  <polygon points={floor.right} fill={floor.rightFill} />
                  <polygon points={floor.top} fill={floor.topFill} />
                  {floor.windows.map((w, k) => (
                    <polygon key={k} points={w.pts} fill={w.fill} />
                  ))}
                </g>
              ))}

              {s.dust.map((d, i) => (
                <circle key={i} cx={d.x} cy={d.y} r={d.r} fill="#d9d2c5" opacity={d.o} />
              ))}

              {/* roof and sign */}
              <g opacity={s.roof.opacity} transform={`translate(0 ${s.roof.y})`}>
                <polygon points={s.roof.left} fill="#2a3140" />
                <polygon points={s.roof.right} fill="#1c2230" />
                <polygon points={s.roof.top} fill="#3a4354" />
                <polygon points={s.roof.signSide} fill="#c98a1c" />
                <polygon points={s.roof.signFace} fill="#f2b544" />
                <text transform={s.roof.textTransform} fontSize="11" fontWeight="700" fill="#1a1200">BEN&amp;CO</text>
              </g>
            </svg>

            <span className="pointer-events-none absolute bottom-4 left-4 flex items-center gap-2 rounded-full bg-[rgba(11,18,32,.6)] px-3 py-1.5 text-xs text-white backdrop-blur-[8px]">
              <span className="h-1.5 w-1.5 rounded-full bg-gold-accent" /> {phaseLabel}
            </span>
            <span className="pointer-events-none absolute bottom-4 right-4 rounded-full bg-[rgba(11,18,32,.6)] px-3 py-1.5 text-xs text-white backdrop-blur-[8px]">
              {hint}
            </span>
          </div>

          {/* Panel */}
          <div className="flex flex-col justify-center gap-5">
            <div ref={ringRef} className="flex items-center gap-4">
              <svg width="92" height="92" viewBox="0 0 92 92" className="-rotate-90">
                <circle cx="46" cy="46" r="40" fill="none" stroke="rgba(255,255,255,.1)" strokeWidth="6" />
                <circle
                  cx="46" cy="46" r="40" fill="none" stroke="#f2b544" strokeWidth="6" strokeLinecap="round"
                  strokeDasharray={ringLength}
                  strokeDashoffset={ringLength * (1 - (ringInView ? progressPercent / 100 : 0))}
                  style={{ transition: 'stroke-dashoffset 1.4s cubic-bezier(.2,.7,.2,1)' }}
                />
              </svg>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-dark">
                  {t('progressLabel')}
                </p>
                <p className="font-display text-[34px] leading-none text-white">{progressPercent}%</p>
                {completion && (
                  <p className="mt-1 text-[13px] text-muted-dark">
                    {t('completionExpected')} <span className="font-semibold text-gold-accent">{completion}</span>
                  </p>
                )}
              </div>
            </div>

            <ol className="space-y-2">
              {stages.map((stage, i) => {
                const isActive = i === active;
                const reached = i <= active;
                return (
                  <li
                    key={`${stage.title}-${i}`}
                    className="grid grid-cols-[28px_1fr_auto] items-center gap-3 rounded-2xl border px-3.5 py-3 transition-all duration-500 ease-smooth"
                    style={{
                      background: isActive ? 'rgba(242,181,68,.1)' : reached ? 'rgba(255,255,255,.05)' : 'transparent',
                      borderColor: isActive ? 'rgba(242,181,68,.45)' : 'transparent',
                      transform: isActive ? 'scale(1.02)' : reached ? 'none' : 'translateX(10px)',
                      opacity: reached ? 1 : 0.45,
                      boxShadow: isActive ? '0 0 0 6px rgba(242,181,68,.18)' : 'none',
                    }}
                  >
                    <span
                      className="flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold"
                      style={{
                        background: stage.isDone ? '#22c55e' : isActive ? '#f2b544' : 'rgba(255,255,255,.12)',
                        color: stage.isDone ? '#fff' : '#1a1200',
                      }}
                    >
                      {stage.isDone ? '✓' : ''}
                    </span>
                    <span>
                      <span className="block text-[15px] font-semibold text-white">{stage.title}</span>
                      {isActive && !stage.isDone && (
                        <span className="block text-xs text-gold-accent">{t('inProgress')}</span>
                      )}
                    </span>
                    {stage.date && <span className="text-[13px] text-muted-dark">{stage.date}</span>}
                  </li>
                );
              })}
            </ol>

            {panel}
          </div>
        </div>
      </div>
    </div>
  );
}
