import { describe, expect, it } from 'vitest';
import { isOverLimit, clientIp, MAX_PER_EMAIL, MAX_PER_IP } from './rate-limit';

describe('isOverLimit', () => {
  it('allows a first submission', () => {
    expect(isOverLimit({ byEmail: 0, byIp: 0 })).toBe(false);
  });

  it(`allows exactly ${MAX_PER_EMAIL} previous submissions from one email`, () => {
    expect(isOverLimit({ byEmail: MAX_PER_EMAIL - 1, byIp: 0 })).toBe(false);
  });

  it(`blocks the ${MAX_PER_EMAIL + 1}th submission from one email`, () => {
    expect(isOverLimit({ byEmail: MAX_PER_EMAIL, byIp: 0 })).toBe(true);
  });

  it(`blocks once an IP passes ${MAX_PER_IP}`, () => {
    expect(isOverLimit({ byEmail: 0, byIp: MAX_PER_IP })).toBe(true);
    expect(isOverLimit({ byEmail: 0, byIp: MAX_PER_IP - 1 })).toBe(false);
  });

  it('blocks when either limit is passed', () => {
    expect(isOverLimit({ byEmail: MAX_PER_EMAIL, byIp: MAX_PER_IP })).toBe(true);
  });
});

describe('clientIp', () => {
  const make = (entries: Record<string, string>) => new Headers(entries);

  it('prefers the edge-set header over client-supplied ones', () => {
    expect(
      clientIp(make({ 'x-vercel-forwarded-for': '9.9.9.9', 'x-forwarded-for': '1.2.3.4' })),
    ).toBe('9.9.9.9');
  });

  it('takes the LAST forwarded hop, not the spoofable first one', () => {
    expect(clientIp(make({ 'x-forwarded-for': '6.6.6.6, 7.7.7.7, 8.8.8.8' }))).toBe('8.8.8.8');
  });

  it('falls back to x-real-ip', () => {
    expect(clientIp(make({ 'x-real-ip': '5.5.5.5' }))).toBe('5.5.5.5');
  });

  it('returns null when no proxy headers are present', () => {
    expect(clientIp(make({}))).toBeNull();
  });

  it('ignores an empty header', () => {
    expect(clientIp(make({ 'x-forwarded-for': '   ' }))).toBeNull();
  });
});
