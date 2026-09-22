import { describe, expect, it } from 'vitest';
import { storagePathFor, isAllowedImage } from './storage';

describe('storagePathFor', () => {
  it('namespaces the file under the owner id', () => {
    expect(storagePathFor('abc-123', 'photo.jpg', 1700000000000)).toMatch(/^abc-123\//);
  });

  it('keeps the extension, lowercased', () => {
    expect(storagePathFor('id', 'Photo.JPEG', 1)).toMatch(/\.jpeg$/);
  });

  it('slugifies the filename', () => {
    expect(storagePathFor('id', 'Vila sa jezerom 1.avif', 1)).toBe('id/1-vila-sa-jezerom-1.avif');
  });

  it('strips directory traversal from the name', () => {
    const path = storagePathFor('id', '../../etc/passwd.png', 1);
    expect(path).not.toContain('..');
    expect(path).toBe('id/1-passwd.png');
  });

  it('falls back to a generic name when nothing usable remains', () => {
    expect(storagePathFor('id', '!!!.png', 1)).toBe('id/1-slika.png');
  });

  it('defaults the extension when the file has none', () => {
    expect(storagePathFor('id', 'photo', 1)).toBe('id/1-photo.jpg');
  });
});

describe('isAllowedImage', () => {
  it('accepts common image types', () => {
    expect(isAllowedImage('image/jpeg', 1000)).toBe(true);
    expect(isAllowedImage('image/avif', 1000)).toBe(true);
    expect(isAllowedImage('image/webp', 1000)).toBe(true);
  });

  it('rejects non-images', () => {
    expect(isAllowedImage('application/pdf', 1000)).toBe(false);
    expect(isAllowedImage('text/html', 1000)).toBe(false);
  });

  it('rejects files over 8 MB', () => {
    expect(isAllowedImage('image/jpeg', 8 * 1024 * 1024 + 1)).toBe(false);
    expect(isAllowedImage('image/jpeg', 8 * 1024 * 1024)).toBe(true);
  });

  it('rejects empty files', () => {
    expect(isAllowedImage('image/jpeg', 0)).toBe(false);
  });
});
