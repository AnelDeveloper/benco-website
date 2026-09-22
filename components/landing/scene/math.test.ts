import { describe, expect, it } from 'vitest';
import { computeScene, bounce, lerp3, lerpColor, map, iso, box, stageIndex, STARS, W, D, H } from './math';

describe('map', () => {
  it('remaps within range and clamps outside it', () => {
    expect(map(0.5, 0, 1, 0, 100)).toBe(50);
    expect(map(-1, 0, 1, 0, 100)).toBe(0);
    expect(map(2, 0, 1, 0, 100)).toBe(100);
  });
});

describe('bounce', () => {
  it('starts at zero and ends exactly at one', () => {
    expect(bounce(0)).toBe(0);
    expect(bounce(1)).toBe(1);
    expect(bounce(1.4)).toBe(1);
  });

  it('overshoots then settles — the landing has a rebound', () => {
    const samples = Array.from({ length: 40 }, (_, i) => bounce(i / 39));
    const dips = samples.slice(1).filter((v, i) => v < samples[i]).length;
    expect(dips).toBeGreaterThan(0);
  });
});

describe('colour interpolation', () => {
  it('returns the endpoints exactly', () => {
    expect(lerpColor('#000000', '#ffffff', 0)).toBe('rgb(0,0,0)');
    expect(lerpColor('#000000', '#ffffff', 1)).toBe('rgb(255,255,255)');
  });

  it('passes through the middle stop at t = 0.5', () => {
    expect(lerp3('#000000', '#ff0000', '#ffffff', 0.5)).toBe('rgb(255,0,0)');
  });
});

describe('isometric projection', () => {
  it('places the origin at the projection centre', () => {
    expect(iso(0, 0, 0)).toEqual([318, 318]);
  });

  it('raises z upward on screen', () => {
    expect(iso(0, 0, 30)[1]).toBeLessThan(iso(0, 0, 0)[1]);
  });

  it('produces four points per face', () => {
    const faces = box(0, 0, W, D, 0, H);
    for (const face of [faces.top, faces.left, faces.right]) {
      expect(face.split(' ')).toHaveLength(4);
    }
  });
});

describe('STARS', () => {
  it('is deterministic, so server and client agree', () => {
    expect(STARS).toHaveLength(46);
    expect(STARS[0]).toEqual(STARS[0]);
    expect(STARS.every((s) => s.y < 250 && s.x <= 640)).toBe(true);
  });
});

describe('computeScene', () => {
  it('starts with nothing built', () => {
    const s = computeScene(0);
    expect(s.foundation.opacity).toBe(0);
    expect(s.floors.every((f) => f.opacity === 0)).toBe(true);
    expect(s.roof.opacity).toBe(0);
    expect(s.phase).toBe(0);
  });

  it('finishes fully built at p = 1', () => {
    const s = computeScene(1);
    expect(s.foundation.opacity).toBe(1);
    expect(s.floors.every((f) => f.opacity === 1)).toBe(true);
    expect(s.roof.opacity).toBe(1);
    expect(s.phase).toBe(5);
    expect(s.built).toBe(1);
  });

  it('raises floors from the bottom up', () => {
    const mid = computeScene(0.4);
    const opacities = mid.floors.map((f) => f.opacity);
    // Lower floors are never less built than higher ones.
    for (let i = 1; i < opacities.length; i += 1) {
      expect(opacities[i - 1]).toBeGreaterThanOrEqual(opacities[i]);
    }
  });

  it('honours the floor count within 3–8', () => {
    expect(computeScene(1, 3).floors).toHaveLength(3);
    expect(computeScene(1, 8).floors).toHaveLength(8);
    expect(computeScene(1, 99).floors).toHaveLength(8);
    expect(computeScene(1, 1).floors).toHaveLength(3);
  });

  it('gives every floor seven windows', () => {
    for (const floor of computeScene(1).floors) {
      expect(floor.windows).toHaveLength(7);
    }
  });

  it('lights the windows only near the end', () => {
    const dark = computeScene(0.5).floors[0].windows[0].fill;
    const lit = computeScene(1).floors[0].windows[0].fill;
    expect(dark).not.toBe(lit);
    expect(lit).toBe('rgb(255,210,122)');
  });

  it('turns the sky from day to night', () => {
    expect(computeScene(0).sky.top).toBe('rgb(143,185,230)');
    expect(computeScene(1).sky.top).toBe('rgb(7,11,24)');
  });

  it('can be forced to night regardless of progress', () => {
    expect(computeScene(0, 5, 1).sky.top).toBe(computeScene(1).sky.top);
  });

  it('sets the sun and moon on opposite schedules', () => {
    expect(computeScene(0).sun.o).toBe(1);
    expect(computeScene(1).sun.o).toBe(0);
    expect(computeScene(0).moon.o).toBe(0);
    expect(computeScene(1).moon.o).toBe(1);
  });

  it('emits dust only while a floor is landing', () => {
    expect(computeScene(0).dust).toHaveLength(0);
    expect(computeScene(1).dust).toHaveLength(0);
    const landing = Array.from({ length: 100 }, (_, i) => computeScene(i / 100).dust.length);
    expect(Math.max(...landing)).toBeGreaterThan(0);
  });

  it('fades the crane out once the building tops out', () => {
    expect(computeScene(0.5).crane.opacity).toBe(1);
    expect(computeScene(0.95).crane.opacity).toBe(0);
  });
});

describe('stageIndex', () => {
  it('walks the milestones from first to last', () => {
    expect(stageIndex(0, 5)).toBe(0);
    expect(stageIndex(1, 5)).toBe(4);
    expect(stageIndex(0.5, 5)).toBeGreaterThan(0);
  });

  it('never goes out of bounds for an empty list', () => {
    expect(stageIndex(0.5, 0)).toBe(0);
  });
});
