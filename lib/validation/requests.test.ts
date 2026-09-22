import { describe, expect, it } from 'vitest';
import { bookingSchema, requestSchema } from './requests';

// Real v4 UUIDs: zod enforces the version and variant bits, so placeholder
// strings like 1111-1111-… are rejected where a Supabase id would pass.

const validBooking = {
  propertyId: '3f2504e0-4f89-41d3-9a0c-0305e82c3301',
  checkIn: '2026-10-01',
  checkOut: '2026-10-05',
  name: 'Amir Ć.',
  email: 'amir@example.com',
  phone: '+387 61 111 222',
  guests: 2,
};

describe('bookingSchema', () => {
  it('accepts a valid booking', () => {
    expect(bookingSchema.safeParse(validBooking).success).toBe(true);
  });

  it('rejects a malformed email', () => {
    expect(bookingSchema.safeParse({ ...validBooking, email: 'nope' }).success).toBe(false);
  });

  it('rejects an empty name', () => {
    expect(bookingSchema.safeParse({ ...validBooking, name: '  ' }).success).toBe(false);
  });

  it('requires at least one guest', () => {
    expect(bookingSchema.safeParse({ ...validBooking, guests: 0 }).success).toBe(false);
  });

  it('rejects a non-uuid property id', () => {
    expect(bookingSchema.safeParse({ ...validBooking, propertyId: 'abc' }).success).toBe(false);
  });

  it('allows a missing phone', () => {
    const { phone: _phone, ...withoutPhone } = validBooking;
    expect(bookingSchema.safeParse(withoutPhone).success).toBe(true);
  });
});

const validRequest = {
  kind: 'investment' as const,
  projectId: '9b2e4d7c-8a1f-4c3b-b5e6-7d8f9a0b1c2d',
  name: 'Lejla H.',
  email: 'lejla@example.com',
  amount: 25000,
};

describe('requestSchema', () => {
  it('accepts a valid investment request', () => {
    expect(requestSchema.safeParse(validRequest).success).toBe(true);
  });

  it('requires a project for an investment', () => {
    const { projectId: _id, ...noProject } = validRequest;
    expect(requestSchema.safeParse(noProject).success).toBe(false);
  });

  it('requires a project for an off-plan request', () => {
    expect(requestSchema.safeParse({ ...validRequest, kind: 'offplan', projectId: undefined }).success).toBe(false);
  });

  it('requires a property for a purchase', () => {
    expect(
      requestSchema.safeParse({
        kind: 'purchase',
        name: 'X',
        email: 'x@example.com',
        projectId: '9b2e4d7c-8a1f-4c3b-b5e6-7d8f9a0b1c2d',
      }).success,
    ).toBe(false);
  });

  it('accepts a purchase with a property', () => {
    expect(
      requestSchema.safeParse({
        kind: 'purchase',
        propertyId: '5c1a2b3d-4e5f-4a6b-8c9d-0e1f2a3b4c5d',
        name: 'X',
        email: 'x@example.com',
      }).success,
    ).toBe(true);
  });

  it('rejects a negative investment amount', () => {
    expect(requestSchema.safeParse({ ...validRequest, amount: -5 }).success).toBe(false);
  });

  it('rejects an unknown kind', () => {
    expect(requestSchema.safeParse({ ...validRequest, kind: 'donation' }).success).toBe(false);
  });
});
