import { describe, expect, it } from 'vitest';
import { localized } from './localized';

const row = {
  title_bs: 'Vila sa jezerom',
  title_en: 'Lakeside villa',
  description_bs: 'Opis',
  description_en: null,
  note_bs: null,
  note_en: null,
};

describe('localized', () => {
  it('returns the Bosnian value for locale bs', () => {
    expect(localized(row, 'title', 'bs')).toBe('Vila sa jezerom');
  });

  it('returns the English value for locale en', () => {
    expect(localized(row, 'title', 'en')).toBe('Lakeside villa');
  });

  it('falls back to Bosnian when the English value is null', () => {
    expect(localized(row, 'description', 'en')).toBe('Opis');
  });

  it('falls back to Bosnian when the English value is an empty string', () => {
    expect(localized({ x_bs: 'ima', x_en: '   ' }, 'x', 'en')).toBe('ima');
  });

  it('returns an empty string when neither language has a value', () => {
    expect(localized(row, 'note', 'en')).toBe('');
  });

  it('returns an empty string for a field that does not exist', () => {
    expect(localized(row, 'missing', 'bs')).toBe('');
  });
});
