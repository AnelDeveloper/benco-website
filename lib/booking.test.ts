import { describe, expect, it } from 'vitest';
import {
  toDateRange,
  nightsBetween,
  validateStay,
  totalPrice,
  parseAvailability,
  MAX_NIGHTS,
} from './booking';

const TODAY = new Date('2026-09-22T10:00:00Z');

describe('toDateRange', () => {
  it('formats a half-open range', () => {
    expect(toDateRange('2026-10-01', '2026-10-05')).toBe('[2026-10-01,2026-10-05)');
  });
});

describe('nightsBetween', () => {
  it('counts nights, not days', () => {
    expect(nightsBetween('2026-10-01', '2026-10-05')).toBe(4);
  });

  it('returns 1 for a single night', () => {
    expect(nightsBetween('2026-10-01', '2026-10-02')).toBe(1);
  });

  it('returns 0 when the dates are the same', () => {
    expect(nightsBetween('2026-10-01', '2026-10-01')).toBe(0);
  });

  it('counts across a month boundary', () => {
    expect(nightsBetween('2026-10-30', '2026-11-02')).toBe(3);
  });
});

describe('validateStay', () => {
  it('accepts a normal stay', () => {
    expect(validateStay('2026-10-01', '2026-10-05', TODAY).ok).toBe(true);
  });

  it('rejects a check-in in the past', () => {
    const result = validateStay('2026-09-01', '2026-09-05', TODAY);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/pro[šs]l/i);
  });

  it('accepts a stay starting today', () => {
    expect(validateStay('2026-09-22', '2026-09-24', TODAY).ok).toBe(true);
  });

  it('rejects checkout before check-in', () => {
    expect(validateStay('2026-10-05', '2026-10-01', TODAY).ok).toBe(false);
  });

  it('rejects a zero-night stay', () => {
    expect(validateStay('2026-10-01', '2026-10-01', TODAY).ok).toBe(false);
  });

  it(`rejects more than ${MAX_NIGHTS} nights`, () => {
    expect(validateStay('2026-10-01', '2026-11-05', TODAY).ok).toBe(false);
  });

  it(`accepts exactly ${MAX_NIGHTS} nights`, () => {
    expect(validateStay('2026-10-01', '2026-10-31', TODAY).ok).toBe(true);
  });

  it('rejects dates more than a year ahead', () => {
    expect(validateStay('2028-01-01', '2028-01-05', TODAY).ok).toBe(false);
  });

  it('rejects malformed dates', () => {
    expect(validateStay('not-a-date', '2026-10-05', TODAY).ok).toBe(false);
    expect(validateStay('', '', TODAY).ok).toBe(false);
  });
});

describe('totalPrice', () => {
  it('multiplies nightly price by nights', () => {
    expect(totalPrice(180, 4)).toBe(720);
  });

  it('rounds to two decimals', () => {
    expect(totalPrice(99.999, 3)).toBe(300);
    expect(totalPrice(33.333, 3)).toBe(100);
  });

  it('returns null when there is no nightly price', () => {
    expect(totalPrice(null, 4)).toBeNull();
  });
});

describe('parseAvailability', () => {
  it('turns half-open ranges into inclusive occupied nights', () => {
    const result = parseAvailability([{ period: '[2026-10-01,2026-10-04)' }]);
    expect(result).toEqual([{ from: '2026-10-01', to: '2026-10-03' }]);
  });

  it('handles a one-night stay', () => {
    expect(parseAvailability([{ period: '[2026-10-01,2026-10-02)' }])).toEqual([
      { from: '2026-10-01', to: '2026-10-01' },
    ]);
  });

  it('ignores rows it cannot parse', () => {
    expect(parseAvailability([{ period: 'garbage' }])).toEqual([]);
  });

  it('handles an empty list', () => {
    expect(parseAvailability([])).toEqual([]);
  });
});
