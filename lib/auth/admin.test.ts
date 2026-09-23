import { describe, expect, it } from 'vitest';
import { isAdminEmail } from './admin';
import { CAN } from './roles';

describe('isAdminEmail', () => {
  it('accepts an exact match', () => {
    expect(isAdminEmail('a@b.com', 'a@b.com')).toBe(true);
  });

  it('is case-insensitive on both sides', () => {
    expect(isAdminEmail('A@B.com', 'a@b.COM')).toBe(true);
  });

  it('ignores surrounding whitespace in the list', () => {
    expect(isAdminEmail('a@b.com', ' a@b.com , c@d.com ')).toBe(true);
  });

  it('accepts any email in a comma-separated list', () => {
    expect(isAdminEmail('c@d.com', 'a@b.com,c@d.com')).toBe(true);
  });

  it('rejects an email that is not in the list', () => {
    expect(isAdminEmail('x@y.com', 'a@b.com,c@d.com')).toBe(false);
  });

  it('rejects everything when the list is empty', () => {
    expect(isAdminEmail('a@b.com', '')).toBe(false);
  });

  it('rejects everything when the list is undefined', () => {
    expect(isAdminEmail('a@b.com', undefined)).toBe(false);
  });

  it('rejects an empty or missing email even if the list has blanks', () => {
    expect(isAdminEmail('', 'a@b.com,,')).toBe(false);
    expect(isAdminEmail(undefined, 'a@b.com')).toBe(false);
  });

  it('does not match on a substring', () => {
    expect(isAdminEmail('evil-a@b.com', 'a@b.com')).toBe(false);
  });
});

describe('CAN — what each role may reach', () => {
  it('gives admin everything', () => {
    expect(CAN.admin).toEqual({ content: true, customers: true, users: true });
  });

  it('limits support to customers', () => {
    expect(CAN.support.customers).toBe(true);
    expect(CAN.support.content).toBe(false);
    expect(CAN.support.users).toBe(false);
  });

  it('gives a parked user nothing', () => {
    expect(CAN.user).toEqual({ content: false, customers: false, users: false });
  });

  it('never lets a non-admin manage users', () => {
    for (const role of ['user', 'support'] as const) {
      expect(CAN[role].users).toBe(false);
    }
  });
});
