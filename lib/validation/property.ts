import { z } from 'zod';

export type ParseResult<T> =
  | { ok: true; data: T }
  | { ok: false; errors: Record<string, string> };

/**
 * A field absent from a FormData arrives as `undefined`, and an empty input as
 * `""`. Both must become null rather than failing validation or becoming 0 —
 * an unchecked "bedrooms" field is unknown, not zero bedrooms.
 */
const optionalNumber = z.preprocess(
  (v) => (v === '' || v === undefined || v === null ? null : v),
  z.union([z.null(), z.coerce.number()]),
);

const optionalText = z.preprocess((v) => {
  if (typeof v !== 'string') return null;
  const trimmed = v.trim();
  return trimmed === '' ? null : trimmed;
}, z.string().nullable());

/** An unchecked checkbox sends nothing at all, so absence means false. */
const checkbox = z.preprocess((v) => v === 'on' || v === 'true', z.boolean());

const numberOrZero = z.preprocess(
  (v) => (v === '' || v === undefined || v === null ? 0 : v),
  z.coerce.number(),
);

const featureList = z.preprocess(
  (v) =>
    typeof v === 'string'
      ? v.split(',').map((f) => f.trim()).filter((f) => f !== '')
      : [],
  z.array(z.string()),
);

const currency = z.preprocess(
  (v) => (typeof v === 'string' && v.trim() !== '' ? v.trim() : 'BAM'),
  z.string(),
);

const propertyBase = z.object({
  title_bs: z.string().trim().min(1, 'Naslov na bosanskom je obavezan'),
  title_en: z.string().trim().min(1, 'Naslov na engleskom je obavezan'),
  description_bs: optionalText,
  description_en: optionalText,
  property_type: z.enum(['villa', 'apartment', 'house', 'land'], {
    message: 'Odaberite tip nekretnine',
  }),
  listing_mode: z.enum(['sale', 'rent', 'both'], { message: 'Odaberite vrstu oglasa' }),
  location: z.string().trim().min(1, 'Lokacija je obavezna'),
  address: optionalText,
  price: optionalNumber,
  price_per_night: optionalNumber,
  currency,
  area_m2: optionalNumber,
  bedrooms: optionalNumber,
  bathrooms: optionalNumber,
  max_guests: optionalNumber,
  features: featureList,
  is_published: checkbox,
  is_featured: checkbox,
  sort_order: numberOrZero,
});

/**
 * A listing must carry the price for the way it is listed. Without this a villa
 * could be published "for rent" with no nightly price, and the booking form
 * would have nothing to quote.
 */
const propertySchema = propertyBase.superRefine((data, ctx) => {
  const needsSale = data.listing_mode === 'sale' || data.listing_mode === 'both';
  const needsRent = data.listing_mode === 'rent' || data.listing_mode === 'both';

  if (needsSale && data.price === null) {
    ctx.addIssue({ code: 'custom', path: ['price'], message: 'Cijena je obavezna za prodaju' });
  }
  if (needsRent && data.price_per_night === null) {
    ctx.addIssue({
      code: 'custom',
      path: ['price_per_night'],
      message: 'Cijena po noći je obavezna za najam',
    });
  }
});

const projectSchema = z.object({
  title_bs: z.string().trim().min(1, 'Naslov na bosanskom je obavezan'),
  title_en: z.string().trim().min(1, 'Naslov na engleskom je obavezan'),
  description_bs: optionalText,
  description_en: optionalText,
  location: z.string().trim().min(1, 'Lokacija je obavezna'),
  status: z.enum(['planning', 'under_construction', 'completed'], {
    message: 'Odaberite status projekta',
  }),
  progress_percent: z.coerce
    .number()
    .int('Napredak mora biti cijeli broj')
    .min(0, 'Napredak ne može biti manji od 0')
    .max(100, 'Napredak ne može biti veći od 100'),
  start_date: optionalText,
  expected_completion: optionalText,
  total_units: optionalNumber,
  available_units: optionalNumber,
  price_per_m2: optionalNumber,
  currency,
  min_investment: optionalNumber,
  expected_return_percent: optionalNumber,
  funding_goal: optionalNumber,
  funded_amount: numberOrZero,
  offers_offplan: checkbox,
  offers_investment: checkbox,
  is_published: checkbox,
  sort_order: numberOrZero,
});

function parse<T>(schema: z.ZodType<T>, formData: FormData): ParseResult<T> {
  const raw = Object.fromEntries(formData.entries());
  const result = schema.safeParse(raw);

  if (result.success) return { ok: true, data: result.data };

  const errors: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const key = String(issue.path[0] ?? 'form');
    errors[key] ??= issue.message;
  }
  return { ok: false, errors };
}

export type PropertyInput = z.infer<typeof propertySchema>;
export type ProjectInput = z.infer<typeof projectSchema>;

export const parsePropertyForm = (formData: FormData) => parse(propertySchema, formData);
export const parseProjectForm = (formData: FormData) => parse(projectSchema, formData);
