/**
 * Isometric construction scene — pure geometry and colour maths.
 *
 * Ported from the design prototype (docs/design/landing-redesign). Everything
 * here is a function of scroll progress `p` (0 → 1) so the scene can be
 * rendered at any point, tested without a browser, and frozen at p = 1 for
 * reduced motion and no-JavaScript.
 */

export const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

/** Remap v from [a,b] onto [c,d], clamped. */
export const map = (v: number, a: number, b: number, c: number, d: number) =>
  c + (d - c) * clamp01((v - a) / (b - a));

export const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

/** Floors land with a bounce rather than easing flatly into place. */
export function bounce(t: number): number {
  if (t >= 1) return 1;
  const n1 = 7.5625;
  const d1 = 2.75;
  if (t < 1 / d1) return n1 * t * t;
  if (t < 2 / d1) return n1 * (t -= 1.5 / d1) * t + 0.75;
  if (t < 2.5 / d1) return n1 * (t -= 2.25 / d1) * t + 0.9375;
  return n1 * (t -= 2.625 / d1) * t + 0.984375;
}

const hex = (c: string): [number, number, number] => [
  parseInt(c.slice(1, 3), 16),
  parseInt(c.slice(3, 5), 16),
  parseInt(c.slice(5, 7), 16),
];

export function lerpColor(a: string, b: string, t: number): string {
  const A = hex(a);
  const B = hex(b);
  const k = clamp01(t);
  return `rgb(${A.map((v, i) => Math.round(v + (B[i] - v) * k)).join(',')})`;
}

/** Three-stop interpolation: day → dusk → night. */
export const lerp3 = (a: string, b: string, c: string, t: number) =>
  t < 0.5 ? lerpColor(a, b, t * 2) : lerpColor(b, c, (t - 0.5) * 2);

// --- Isometric projection -------------------------------------------------

const OX = 318;
const OY = 318;
const COS = 0.866;
const SIN = 0.5;

/** Building footprint: width (x), depth (y), and the height of one floor. */
export const W = 150;
export const D = 110;
export const H = 30;

export const iso = (x: number, y: number, z: number): [number, number] => [
  OX + (x - y) * COS,
  OY + (x + y) * SIN - z,
];

export const pts = (arr: [number, number][]) =>
  arr.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');

export type Box = { top: string; left: string; right: string };

/** The three visible faces of an axis-aligned box in isometric view. */
export function box(x0: number, y0: number, x1: number, y1: number, z0: number, z1: number): Box {
  return {
    top: pts([iso(x0, y0, z1), iso(x1, y0, z1), iso(x1, y1, z1), iso(x0, y1, z1)]),
    left: pts([iso(x0, y1, z0), iso(x1, y1, z0), iso(x1, y1, z1), iso(x0, y1, z1)]),
    right: pts([iso(x1, y0, z0), iso(x1, y1, z0), iso(x1, y1, z1), iso(x1, y0, z1)]),
  };
}

// --- Static scenery -------------------------------------------------------

/** Deterministic pseudo-random stars: same every render, no hydration drift. */
export const STARS = Array.from({ length: 46 }, (_, i) => {
  const f = (n: number) => {
    const s = Math.sin(i * n) * 43758.5453;
    return s - Math.floor(s);
  };
  return {
    x: Math.round(f(12.9898) * 640),
    y: Math.round(f(78.233) * 250),
    r: 0.7 + (i % 3) * 0.45,
    dur: 2 + (i % 5) * 0.7,
    delay: (i % 7) * 0.4,
  };
});

const rects = (raw: number[][]) => raw.map(([x, y, w, h]) => ({ x, y, w, h }));

export const BACK = rects([
  [0, 300, 40, 72], [46, 280, 30, 92], [84, 310, 52, 62], [142, 270, 28, 102],
  [176, 296, 44, 76], [228, 258, 36, 114], [270, 300, 60, 72], [338, 282, 30, 90],
  [374, 302, 50, 70], [430, 262, 34, 110], [470, 292, 46, 80], [522, 306, 40, 66],
  [568, 276, 32, 96], [606, 298, 60, 74],
]);

export const MID = rects([
  [-10, 330, 36, 50], [40, 318, 28, 62], [96, 338, 60, 42], [168, 322, 30, 58],
  [212, 340, 48, 40], [300, 334, 24, 46], [400, 326, 40, 54], [452, 342, 54, 38],
  [520, 320, 30, 60], [562, 338, 58, 42], [634, 326, 40, 54],
]);

// --- The scene ------------------------------------------------------------

export type Floor = Box & {
  opacity: number;
  y: number;
  topFill: string;
  leftFill: string;
  rightFill: string;
  windows: { pts: string; fill: string }[];
};

export type Scene = ReturnType<typeof computeScene>;

export const FLOOR_START = 0.12;

export function computeScene(p: number, floorCount = 5, nightOverride?: number) {
  const n = Math.max(3, Math.min(8, floorCount));
  const night = nightOverride ?? p;

  const sky = {
    top: lerp3('#8fb9e6', '#3b3766', '#070b18', night),
    bottom: lerp3('#dcebf7', '#f0925c', '#1a2440', night),
    ground: lerp3('#c9cfc0', '#6d5a63', '#0e1424', night),
    groundDeep: lerp3('#aeb5a4', '#3a2f3e', '#070b14', night),
    back: lerp3('#b9cbe0', '#5a4f7a', '#111a2e', night),
    mid: lerp3('#96aac4', '#3e355a', '#0c1424', night),
    stars: map(night, 0.62, 0.95, 0, 1),
  };

  const sun = { x: 120 + p * 60, y: map(p, 0, 0.55, 90, 380), o: map(p, 0.35, 0.55, 1, 0) };
  const moon = {
    x: 520, y: map(p, 0.55, 0.9, 260, 70),
    x2: 528, y2: map(p, 0.55, 0.9, 254, 64),
    o: map(p, 0.58, 0.8, 0, 1),
  };
  const skyline = { backX: (0.5 - p) * 30, midX: (0.5 - p) * 70 };

  const per = 0.62 / n;
  const dur = per * 0.85;

  const foundT = map(p, 0.03, 0.11, 0, 1);
  const foundation = {
    ...box(-8, -8, W + 8, D + 8, -10, 0),
    opacity: foundT,
    y: (1 - easeOut(foundT)) * 40,
  };

  const winCount = n * 7;
  let wi = 0;
  const floors: Floor[] = [];
  const dust: { x: number; y: number; r: number; o: number }[] = [];

  for (let i = 0; i < n; i += 1) {
    const s = FLOOR_START + i * per;
    const t = clamp01((p - s) / dur);
    const e = bounce(t);
    const z0 = i * H;

    // Windows light in a shuffled order so the building wakes up unevenly.
    const lit = (idx: number) => {
      const order = (idx * 7 + 3) % winCount;
      const at = 0.76 + (order / winCount) * 0.18;
      return map(p, at, at + 0.015, 0, 1);
    };

    const windows: { pts: string; fill: string }[] = [];
    for (let k = 0; k < 4; k += 1) {
      const x = 12 + k * 34;
      windows.push({
        pts: pts([iso(x, D, z0 + 8), iso(x + 22, D, z0 + 8), iso(x + 22, D, z0 + 24), iso(x, D, z0 + 24)]),
        fill: lerpColor('#2b3341', '#ffd27a', lit(wi++)),
      });
    }
    for (let k = 0; k < 3; k += 1) {
      const y = 12 + k * 32;
      windows.push({
        pts: pts([iso(W, y, z0 + 8), iso(W, y + 22, z0 + 8), iso(W, y + 22, z0 + 24), iso(W, y, z0 + 24)]),
        fill: lerpColor('#1f2632', '#f2b544', lit(wi++)),
      });
    }

    floors.push({
      ...box(0, 0, W, D, z0, z0 + H),
      windows,
      opacity: Math.min(1, t * 4),
      y: -(1 - e) * 110,
      topFill: lerpColor('#e6dfd2', '#8a8a96', night * 0.55),
      leftFill: lerpColor('#c9c0b0', '#6a6a76', night * 0.55),
      rightFill: lerpColor('#9c927f', '#44454f', night * 0.55),
    });

    // Dust kicks up for a moment where the floor meets the one below.
    const dt = (p - (s + dur)) / 0.06;
    if (dt > 0 && dt < 1) {
      const corners: [number, number, number][] = [
        [...iso(0, D, z0), -1] as [number, number, number],
        [...iso(W, D, z0), 0] as [number, number, number],
        [...iso(W, 0, z0), 1] as [number, number, number],
      ];
      for (const [x, y, dir] of corners) {
        for (let j = 0; j < 3; j += 1) {
          dust.push({
            x: x + dir * dt * (18 + j * 10) + (j - 1) * 6,
            y: y + 2 - dt * (10 + j * 6),
            r: 3 + dt * (9 + j * 3),
            o: (1 - dt) * 0.55,
          });
        }
      }
    }
  }

  const zt = n * H;
  const rt = map(p, 0.7, 0.78, 0, 1);
  const sx0 = W / 2 - 34;
  const sz = zt + 14;
  const [tx, ty] = iso(sx0 + 34, D - 4, zt + 16);

  const roof = {
    ...box(4, 4, W - 4, D - 4, zt, zt + 8),
    opacity: rt,
    y: -(1 - easeOut(rt)) * 60,
    signFace: pts([iso(sx0, D - 4, zt + 8), iso(sx0 + 68, D - 4, zt + 8), iso(sx0 + 68, D - 4, sz + 14), iso(sx0, D - 4, sz + 14)]),
    signSide: pts([iso(sx0 + 68, D - 4, zt + 8), iso(sx0 + 68, D - 10, zt + 8), iso(sx0 + 68, D - 10, sz + 14), iso(sx0 + 68, D - 4, sz + 14)]),
    textTransform: `translate(${tx.toFixed(1)} ${ty.toFixed(1)}) skewY(30) translate(-24 4)`,
  };

  const [cx, cy] = iso(W + 70, D * 0.35, 0);
  const craneTop = cy - 350;
  const jibLen = 250;
  const activeFloor = Math.min(n - 1, Math.max(0, Math.floor((p - FLOOR_START) / per)));
  const ft = clamp01((p - (FLOOR_START + activeFloor * per)) / dur);
  const swing = 40 * Math.sin(p * 11);

  const rungs: number[] = [];
  for (let y = craneTop + 12; y < cy; y += 16) rungs.push(y);

  const crane = {
    opacity: map(p, 0.8, 0.9, 1, 0) * map(p, 0, 0.05, 0.4, 1),
    rise: (1 - map(p, 0, 0.1, 0, 1)) * 40,
    x: cx, x2: cx + 7, top: craneTop, h: cy - craneTop, rungs,
    pivotX: cx + 3.5, jibX: cx + 3.5 - jibLen, jibY: craneTop + 2, jibW: jibLen + 40,
    cwX: cx + 22, cabX: cx - 4.5, cabY: craneTop + 8,
    angle: -6 + 10 * Math.sin(p * 11) + (p < FLOOR_START ? 0 : (1 - ft) * 4),
    hookX: cx + 3.5 - jibLen + 46 + swing,
    hookY: craneTop + 6 + Math.max(20, cy - 20 - activeFloor * H - (1 - ft) * 110 - craneTop - 50),
    loadX: cx + 3.5 - jibLen + 46 + swing - 13,
    loadVisible: ft < 0.9 && p > FLOOR_START && p < 0.75,
  };

  return {
    n, sky, sun, moon, skyline, foundation, floors, dust, roof, crane,
    built: map(p, FLOOR_START, 0.78, 0, 1),
    activeFloor,
    /** 0 prepared · 1 foundation · 2 floors · 3 roof · 4 lights · 5 done */
    phase: p < 0.03 ? 0 : p < FLOOR_START ? 1 : p < 0.7 ? 2 : p < 0.8 ? 3 : p < 0.95 ? 4 : 5,
  };
}

/** Which milestone the scene is on, given how many there are. */
export const stageIndex = (p: number, total: number) =>
  Math.min(Math.max(total - 1, 0), Math.floor(map(p, 0.02, 0.95, 0, 1) * total));
