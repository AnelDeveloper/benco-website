import { describe, expect, it } from 'vitest';
import { formatDate, formatNumber } from './format';

describe('formatDate', () => {
  it('formats an ISO timestamp as DD.MM.YYYY', () => {
    expect(formatDate('2026-09-22T10:30:00Z')).toBe('22.09.2026');
  });

  it('pads single-digit days and months', () => {
    expect(formatDate('2026-01-05T00:00:00Z')).toBe('05.01.2026');
  });

  it('formats a plain date string', () => {
    expect(formatDate('2027-06-30')).toBe('30.06.2027');
  });

  it('returns an empty string for missing or invalid input', () => {
    expect(formatDate(null)).toBe('');
    expect(formatDate(undefined)).toBe('');
    expect(formatDate('nonsense')).toBe('');
  });
});

describe('formatNumber', () => {
  it('groups thousands with dots', () => {
    expect(formatNumber(450000)).toBe('450.000');
    expect(formatNumber(1234567)).toBe('1.234.567');
  });

  it('leaves small numbers alone', () => {
    expect(formatNumber(180)).toBe('180');
    expect(formatNumber(0)).toBe('0');
  });

  it('keeps a decimal part with a comma', () => {
    expect(formatNumber(1234.5)).toBe('1.234,5');
  });

  it('returns an empty string for missing input', () => {
    expect(formatNumber(null)).toBe('');
    expect(formatNumber(undefined)).toBe('');
  });
});
