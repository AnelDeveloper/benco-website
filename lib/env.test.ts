import { describe, expect, it } from 'vitest';
import { requireEnv } from './env';

describe('requireEnv', () => {
  it('returns the value when present', () => {
    expect(requireEnv('MY_VAR', { MY_VAR: 'hello' })).toBe('hello');
  });

  it('throws when the variable is missing', () => {
    expect(() => requireEnv('MY_VAR', {})).toThrow(/MY_VAR/);
  });

  it('throws when the variable is only whitespace', () => {
    expect(() => requireEnv('MY_VAR', { MY_VAR: '   ' })).toThrow(/MY_VAR/);
  });

  it('names .env.example in the error so the fix is obvious', () => {
    expect(() => requireEnv('MY_VAR', {})).toThrow(/\.env\.example/);
  });
});
