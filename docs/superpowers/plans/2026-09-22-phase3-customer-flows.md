# Ben&Co Phase 3: Customer Flows — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Property and project pages where a customer books an apartment (dates lock instantly), sends a purchase offer, buys off-plan, or invests — plus the admin screens that manage what arrives.

**Architecture:** Public pages are server components reading published rows. The booking calendar is a client component reading free dates from the `public_availability` view. Submissions go to two API routes that validate, rate-limit, write with the service-role key, and email the owner. Double-booking is prevented by the Postgres exclusion constraint, never by a pre-check.

**Tech Stack:** `react-day-picker`, `date-fns`, `zod`, Resend, Vitest.

**Spec:** `docs/superpowers/specs/2026-09-22-benco-platform-design.md`

## Global Constraints

- Date ranges are half-open `[check_in, check_out)`. Checkout day is free for the next guest.
- **Never check availability then insert.** Insert and handle error `23P01` (exclusion violation) as a 409. A pre-check has a race window; the constraint has none.
- Booking guards: no past dates, minimum 1 night, maximum 30 nights, at most 365 days ahead.
- Rate limit: 5 submissions per email per hour, 15 per IP per hour, counted from `reservations` and `requests`.
- All prices are quoted and stored in the property's own currency.
- Public pages are bilingual; admin screens stay Bosnian.

---

### Task 1: Booking date logic (pure, unit-tested)

**Files:** `lib/booking.ts`, `lib/booking.test.ts`

**Produces:** `toDateRange(from, to)`, `nightsBetween(from, to)`, `validateStay(from, to, today)`, `totalPrice(pricePerNight, nights)`, `parseAvailability(rows)`, `overlaps(a, b)`.

- [ ] Write tests: half-open range formatting; night counting; rejection of past dates, zero nights, 31 nights, and dates beyond a year; back-to-back stays not overlapping; same-day overlap detected; price rounding to 2 decimals; availability rows parsed into disabled intervals.
- [ ] Run — expect failure. Implement. Run — expect pass. Commit.

### Task 2: Request validation and rate limiting

**Files:** `lib/validation/requests.ts`, `lib/validation/requests.test.ts`, `lib/rate-limit.ts`, `lib/rate-limit.test.ts`

**Produces:** `bookingSchema`, `requestSchema`, `isOverLimit(counts)`.

- [ ] Tests: email format; name required; guests at least 1; investment amount must be positive; `offplan`/`investment` require a project; `purchase` requires a property; limits trip at 6 per email and 16 per IP, not at 5 and 15.
- [ ] Implement, verify, commit.

### Task 3: Booking and request API routes

**Files:** `app/api/bookings/route.ts`, `app/api/requests/route.ts`, `lib/email.ts`

- [ ] `POST /api/bookings`: validate → guards → rate limit → insert reservation → **on error code `23P01` return 409** → email guest and owner → 201.
- [ ] `POST /api/requests`: validate → rate limit → insert → email owner → 201.
- [ ] `lib/email.ts` centralises Resend templates; `app/api/contact/route.ts` is refactored onto it instead of keeping its own copy of the HTML.
- [ ] Email failure must not fail a booking that is already stored — log it and still return success.
- [ ] Commit.

### Task 4: Public property pages

**Files:** `app/[locale]/properties/page.tsx`, `app/[locale]/properties/[slug]/page.tsx`, `lib/data/properties.ts` (extend), `components/public/*`

- [ ] `getPublishedProperties(locale, filters)` and `getPropertyBySlug(slug, locale)`.
- [ ] List page with type/mode filters; detail page with gallery, facts, features, and CTAs chosen by `listing_mode`.
- [ ] Make homepage property cards link to their detail pages.
- [ ] `generateMetadata` per property, and extend `app/sitemap.ts` with published properties and projects.
- [ ] Commit.

### Task 5: Booking calendar and forms

**Files:** `components/public/BookingForm.tsx`, `components/public/RequestForm.tsx`, `app/api/availability/[propertyId]/route.ts`

- [ ] Calendar disables taken dates, shows nights and total price live, submits to `/api/bookings`.
- [ ] On 409 show "those dates were just taken" and refetch availability.
- [ ] `RequestForm` serves purchase, off-plan and investment with different fields per kind.
- [ ] Commit.

### Task 6: Public project pages

**Files:** `app/[locale]/invest/page.tsx`, `app/[locale]/invest/[slug]/page.tsx`, `lib/data/projects.ts`

- [ ] Project list with progress; detail page with milestones, funding bar, and up to two CTAs driven by `offers_offplan` / `offers_investment`.
- [ ] Commit.

### Task 7: Admin reservations and requests inboxes

**Files:** `app/admin/(panel)/reservations/page.tsx`, `app/admin/(panel)/requests/page.tsx`, `app/admin/_actions/reservations.ts`, `app/admin/_actions/requests.ts`

- [ ] Reservations list grouped by property, upcoming first; cancel frees the dates; block a date range manually.
- [ ] Requests inbox filtered by kind and status, with status transitions and private notes.
- [ ] Commit.

### Task 8: Navigation, translations and verification

- [ ] Navbar gains Nekretnine and Investiraj links; all new strings added to `bs.json` and `en.json` with matching key sets.
- [ ] End-to-end: book dates → confirm they lock → attempt the same dates → 409 → cancel in admin → dates free again.
- [ ] `npm test`, `npx tsc --noEmit`, `npm run build` green. Commit.

## Done when

- A visitor can book an apartment and the dates immediately become unavailable.
- Booking the same dates twice fails with a clear message, not a double booking.
- Purchase, off-plan and investment requests arrive in the admin inbox and by email.
- Cancelling a booking in admin frees the dates.
