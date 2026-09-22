'use client';

import { useEffect, useRef, useState } from 'react';
import {
  motion,
  useScroll,
  useTransform,
  useMotionValueEvent,
  useReducedMotion,
  type MotionValue,
} from 'framer-motion';
import { Check, HardHat } from 'lucide-react';

export type Stage = { title: string; date: string | null; isDone: boolean };

const FLOOR_COUNT = 5;
const FLOOR_HEIGHT = 46;
const BASE_Y = 330;

/** Each floor rises into place over its own slice of the scroll. */
function floorRange(index: number): [number, number] {
  const start = 0.18 + index * 0.11;
  return [start, start + 0.1];
}

function Windows({ y, lit }: { y: number; lit?: MotionValue<number> }) {
  return (
    <>
      {[0, 1, 2, 3].map((column) => (
        <motion.rect
          key={column}
          x={78 + column * 38}
          y={y + 12}
          width={22}
          height={22}
          rx={2}
          fill="#fbbf24"
          style={lit ? { opacity: lit } : undefined}
        />
      ))}
    </>
  );
}

export function BuildingScene({
  stages,
  progressPercent,
  labels,
}: {
  stages: Stage[];
  progressPercent: number;
  labels: { scrollHint: string; progress: string };
}) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  const [activeStage, setActiveStage] = useState(0);

  // Before mount — and with JavaScript disabled — the finished building is
  // rendered. The animation is an enhancement, never the only way to see it.
  useEffect(() => setMounted(true), []);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end end'],
  });

  useMotionValueEvent(scrollYProgress, 'change', (value) => {
    if (stages.length === 0) return;
    const index = Math.min(stages.length - 1, Math.floor(value * stages.length));
    setActiveStage(index);
  });

  const animate = mounted && !reduceMotion;

  const foundationOpacity = useTransform(scrollYProgress, [0.05, 0.16], [0, 1]);
  const craneY = useTransform(scrollYProgress, [0, 0.8], [40, -150]);
  const roofOpacity = useTransform(scrollYProgress, [0.78, 0.88], [0, 1]);
  const signOpacity = useTransform(scrollYProgress, [0.88, 0.97], [0, 1]);
  const litWindows = useTransform(scrollYProgress, [0.72, 0.92], [0.12, 1]);

  return (
    <div ref={sectionRef} className="relative" style={{ height: animate ? '320vh' : 'auto' }}>
      <div className={animate ? 'sticky top-0 flex min-h-screen items-center' : ''}>
        <div className="mx-auto grid w-full max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:gap-16 lg:px-8">
          {/* The building */}
          <div className="relative mx-auto w-full max-w-md">
            <svg viewBox="0 0 300 400" className="w-full drop-shadow-2xl" role="img" aria-label="Zgrada u izgradnji">
              {/* sky glow */}
              <defs>
                <linearGradient id="facade" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#334155" />
                  <stop offset="100%" stopColor="#1e293b" />
                </linearGradient>
                <linearGradient id="ground" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#475569" stopOpacity="0.2" />
                  <stop offset="50%" stopColor="#475569" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#475569" stopOpacity="0.2" />
                </linearGradient>
              </defs>

              {/* crane mast */}
              <motion.g style={animate ? { y: craneY } : undefined}>
                <rect x={246} y={120} width={5} height={220} fill="#64748b" />
                <rect x={188} y={118} width={70} height={5} fill="#f59e0b" />
                <line x1={196} y1={123} x2={196} y2={150} stroke="#64748b" strokeWidth={2} />
                <rect x={189} y={150} width={14} height={10} fill="#f59e0b" />
              </motion.g>

              {/* ground */}
              <rect x={20} y={356} width={260} height={4} rx={2} fill="url(#ground)" />

              {/* foundation */}
              <motion.rect
                x={62} y={332} width={176} height={26} rx={3}
                fill="#475569"
                style={animate ? { opacity: foundationOpacity } : undefined}
              />

              {/* floors, bottom to top */}
              {Array.from({ length: FLOOR_COUNT }).map((_, index) => {
                const y = BASE_Y - (index + 1) * FLOOR_HEIGHT;
                return (
                  <Floor
                    key={index}
                    index={index}
                    y={y}
                    scrollYProgress={scrollYProgress}
                    animate={animate}
                    lit={animate ? litWindows : undefined}
                  />
                );
              })}

              {/* roof */}
              <motion.g style={animate ? { opacity: roofOpacity } : undefined}>
                <polygon points="62,102 150,66 238,102" fill="#0f172a" />
                <rect x={140} y={52} width={4} height={18} fill="#f59e0b" />
                <polygon points="144,52 168,58 144,64" fill="#f59e0b" />
              </motion.g>

              {/* sign */}
              <motion.g style={animate ? { opacity: signOpacity } : undefined}>
                {/* Sits on the foundation, clear of the ground-floor windows. */}
                <rect x={104} y={336} width={92} height={19} rx={3} fill="#f59e0b" />
                <text x={150} y={350} textAnchor="middle" fontSize={12} fontWeight="700" fill="#0f172a">
                  BEN&amp;CO
                </text>
              </motion.g>
            </svg>

            {animate && (
              <p className="mt-2 text-center text-xs uppercase tracking-widest text-slate-400">
                {labels.scrollHint}
              </p>
            )}
          </div>

          {/* The stages */}
          <div className="flex flex-col justify-center">
            <div className="mb-6">
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="text-slate-400">{labels.progress}</span>
                <span className="text-2xl font-bold text-gold-400">{progressPercent}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-700">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-gold-500 to-gold-300"
                  initial={{ width: 0 }}
                  whileInView={{ width: `${progressPercent}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 1.2, ease: 'easeOut' }}
                />
              </div>
            </div>

            <ol className="space-y-3">
              {stages.map((stage, index) => {
                const reached = !animate || index <= activeStage;
                return (
                  <li
                    key={`${stage.title}-${index}`}
                    className={`flex items-start gap-3 rounded-xl border p-4 transition-all duration-500 ${
                      reached
                        ? 'border-gold-500/40 bg-slate-800/80 opacity-100'
                        : 'border-slate-700/60 bg-slate-800/30 opacity-40'
                    }`}
                    style={{ transform: reached ? 'translateX(0)' : 'translateX(12px)' }}
                  >
                    <span
                      className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                        stage.isDone ? 'bg-green-500 text-white' : reached ? 'bg-gold-500 text-slate-900' : 'bg-slate-700 text-slate-500'
                      }`}
                    >
                      {stage.isDone ? <Check size={15} /> : <HardHat size={14} />}
                    </span>
                    <span>
                      <span className="block font-semibold text-white">{stage.title}</span>
                      {stage.date && <span className="block text-sm text-slate-400">{stage.date}</span>}
                    </span>
                  </li>
                );
              })}
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}

function Floor({
  index,
  y,
  scrollYProgress,
  animate,
  lit,
}: {
  index: number;
  y: number;
  scrollYProgress: MotionValue<number>;
  animate: boolean;
  lit?: MotionValue<number>;
}) {
  const [from, to] = floorRange(index);
  const opacity = useTransform(scrollYProgress, [from, to], [0, 1]);
  const translateY = useTransform(scrollYProgress, [from, to], [26, 0]);

  return (
    <motion.g style={animate ? { opacity, y: translateY } : undefined}>
      <rect x={68} y={y} width={164} height={FLOOR_HEIGHT - 4} rx={2} fill="url(#facade)" />
      <rect x={68} y={y} width={164} height={2} fill="#64748b" opacity={0.6} />
      <Windows y={y} lit={lit} />
    </motion.g>
  );
}
