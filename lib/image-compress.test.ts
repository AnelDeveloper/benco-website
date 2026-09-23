import { describe, expect, it } from 'vitest';
import { fitWithin, renameTo, MAX_EDGE } from './image-compress';

describe('fitWithin', () => {
  it('leaves an already-small image alone', () => {
    expect(fitWithin(800, 600)).toEqual({ width: 800, height: 600 });
  });

  it('never enlarges', () => {
    expect(fitWithin(100, 100, 2200)).toEqual({ width: 100, height: 100 });
  });

  it('scales a landscape photo by its long edge', () => {
    expect(fitWithin(4000, 3000)).toEqual({ width: 2200, height: 1650 });
  });

  it('scales a portrait photo by its long edge', () => {
    expect(fitWithin(3000, 4000)).toEqual({ width: 1650, height: 2200 });
  });

  it('keeps the aspect ratio', () => {
    const { width, height } = fitWithin(4032, 3024);
    expect(width / height).toBeCloseTo(4032 / 3024, 2);
  });

  it('handles a square', () => {
    expect(fitWithin(5000, 5000)).toEqual({ width: MAX_EDGE, height: MAX_EDGE });
  });

  it('is safe with nonsense dimensions', () => {
    expect(fitWithin(0, 0)).toEqual({ width: 0, height: 0 });
    expect(fitWithin(-5, 10)).toEqual({ width: 0, height: 0 });
  });
});

describe('renameTo', () => {
  it('swaps the extension for the encoded format', () => {
    expect(renameTo('IMG_1234.HEIC', 'image/webp')).toBe('IMG_1234.webp');
    expect(renameTo('photo.png', 'image/jpeg')).toBe('photo.jpg');
  });

  it('copes with a name that has no extension', () => {
    expect(renameTo('photo', 'image/webp')).toBe('photo.webp');
  });

  it('falls back to a generic name', () => {
    expect(renameTo('.jpg', 'image/webp')).toBe('slika.webp');
  });
});
