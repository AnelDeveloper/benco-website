import { z } from 'zod';

const name = z.string().trim().min(1, 'Ime je obavezno').max(120);
/**
 * Lowercased after validation so the rate limiter cannot be sidestepped by
 * varying capitalisation — Amir@x.com and amir@x.com are one person, and the
 * stored value must match what the limiter counts.
 */
const email = z
  .string()
  .trim()
  .max(200)
  .email('Unesite ispravnu email adresu')
  .transform((value) => value.toLowerCase());
const phone = z.string().trim().max(50).optional().nullable();
const message = z.string().trim().max(2000).optional().nullable();
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Neispravan datum');

export const bookingSchema = z.object({
  propertyId: z.string().uuid(),
  checkIn: isoDate,
  checkOut: isoDate,
  name,
  email,
  phone,
  guests: z.coerce.number().int().min(1, 'Najmanje jedan gost').max(50),
  message,
});

export type BookingInput = z.infer<typeof bookingSchema>;

/**
 * A request must point at what it is about: a purchase at a property, an
 * off-plan or investment request at a project. The database enforces the same
 * rule, so a mismatch cannot slip through either layer.
 */
export const requestSchema = z
  .object({
    kind: z.enum(['purchase', 'offplan', 'investment']),
    propertyId: z.string().uuid().optional().nullable(),
    projectId: z.string().uuid().optional().nullable(),
    name,
    email,
    phone,
    message,
    amount: z.coerce.number().positive('Iznos mora biti veći od nule').optional().nullable(),
    units: z.coerce.number().int().positive().optional().nullable(),
  })
  .superRefine((data, ctx) => {
    if (data.kind === 'purchase' && !data.propertyId) {
      ctx.addIssue({ code: 'custom', path: ['propertyId'], message: 'Nedostaje nekretnina' });
    }
    if ((data.kind === 'offplan' || data.kind === 'investment') && !data.projectId) {
      ctx.addIssue({ code: 'custom', path: ['projectId'], message: 'Nedostaje projekat' });
    }
  });

export type RequestInput = z.infer<typeof requestSchema>;
