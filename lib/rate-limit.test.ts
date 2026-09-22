import { describe, expect, it } from 'vitest';
import { isOverLimit, MAX_PER_EMAIL, MAX_PER_IP } from './rate-limit';

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
