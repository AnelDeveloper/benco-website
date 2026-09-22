import { describe, expect, it } from 'vitest';
import { slugify } from './slug';

describe('slugify', () => {
  it('lowercases and joins words with dashes', () => {
    expect(slugify('Vila sa jezerom')).toBe('vila-sa-jezerom');
  });

  it('keeps digits', () => {
    expect(slugify('Apartman Dacha 2')).toBe('apartman-dacha-2');
  });

  it('folds Bosnian diacritics to ASCII', () => {
    expect(slugify('Čćšžđ ČĆŠŽĐ')).toBe('ccszd-ccszd');
  });

  it('collapses repeated spaces and dashes', () => {
    expect(slugify('Vila   --  jezero')).toBe('vila-jezero');
  });

  it('strips leading and trailing dashes', () => {
    expect(slugify('  -Vila-  ')).toBe('vila');
  });

  it('drops punctuation', () => {
    expect(slugify('Vila, sa (bazenom)!')).toBe('vila-sa-bazenom');
  });

  it('returns an empty string for input with nothing usable', () => {
    expect(slugify('!!!')).toBe('');
    expect(slugify('')).toBe('');
  });
});
