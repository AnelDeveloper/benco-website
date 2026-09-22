# Ben&Co: Admin Panel, Bookings, and Investment Platform

**Date:** 2026-09-22
**Status:** Approved design, ready for implementation planning

## 1. Overview

Ben&Co today is a static marketing site: one page, six hardcoded properties, and a
contact form that sends email through Resend. This design turns it into a managed
platform.

The owner logs into an admin panel and manages real estate and construction projects
himself. Visitors book rental apartments instantly against a live calendar, send
purchase offers, buy apartments off-plan during construction, or invest money in a
project for a return. A scroll-driven animation shows buildings under construction
using real progress data.

### Decisions already made

| Question | Decision |
|---|---|
| Online payments | None. Bookings lock dates; money is handled offline. |
| Hosting and data | Vercel + Supabase (Postgres, Storage, Auth). |
| Customer accounts | None. Customers submit forms; only the owner logs in. |
| What "invest" means | Two offers per project: buy off-plan, or fund for a return. |
| Booking model | Instant. Dates lock on submit; the owner cancels if needed. |
| Admin panel language | Bosnian only. |

## 2. Architecture

One Next.js 15 app on Vercel, unchanged in shape. Three new external pieces, all
Supabase:

- **Postgres** holds properties, projects, reservations, and requests. The schema
  lives in version-controlled SQL under `supabase/migrations/`, not only in the
  Supabase dashboard, so it can be reviewed, diffed, and recreated.
- **Storage** holds photos uploaded from the admin panel, in two public-read buckets:
  `property-images` and `project-images`.
- **Auth** provides the single admin login. No signup route is built, so no one can
  register.

### Security model

This is the part that must not be improvised.

- The browser receives only `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Under row-level security
  that key can **read published rows and nothing else** — no writes, anywhere.
- Every write (creating a property, uploading a photo, submitting a booking) runs on
  the server using `SUPABASE_SERVICE_ROLE_KEY`, which is never sent to the browser and
  never imported into a client component.
- Admin identity is verified server-side on every `/admin` request. A caller must have
  a valid Supabase session **and** an email listed in `ADMIN_EMAILS`. Two checks, so a
  stray Supabase user cannot reach the panel.
- Guest names, emails, and phone numbers are never exposed to anonymous readers. The
  public calendar reads a view that returns only property id and date range.

### Routing

`/admin` lives outside `app/[locale]/` and is not localized. Middleware branches:
requests starting with `/admin` go through Supabase session refresh and the auth
guard; everything else goes through the existing next-intl middleware.

```ts
// middleware.ts
export default async function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith('/admin')) {
    return updateAdminSession(request);   // refresh cookies, redirect to /admin/login if absent
  }
  return intlMiddleware(request);
}

export const config = {
  matcher: ['/', '/(bs|en)/:path*', '/admin/:path*', '/((?!_next|_vercel|.*\\..*).*)']
};
```

## 3. Data model

All tables have `id uuid primary key default gen_random_uuid()`, `created_at
timestamptz default now()`, and where edited, `updated_at timestamptz`.

### `properties`

Bilingual content, because the public site is Bosnian and English.

| Column | Type | Notes |
|---|---|---|
| `slug` | text unique | URL segment |
| `title_bs`, `title_en` | text not null | |
| `description_bs`, `description_en` | text | |
| `property_type` | text | `villa` \| `apartment` \| `house` \| `land` |
| `listing_mode` | text | `sale` \| `rent` \| `both` — decides which buttons appear |
| `location`, `address` | text | |
| `price` | numeric(12,2) | sale price, null for rent-only |
| `price_per_night` | numeric(10,2) | rental price, null for sale-only |
| `currency` | text default `'BAM'` | |
| `area_m2` | numeric(8,2) | |
| `bedrooms`, `bathrooms`, `max_guests` | int | |
| `features` | text[] default `'{}'` | pool, garage, garden… |
| `is_published` | bool default false | invisible to public until true |
| `is_featured` | bool default false | appears on the homepage |
| `sort_order` | int default 0 | |

### `property_images`

`property_id` (cascade delete), `url` text, `alt_bs`, `alt_en`, `sort_order`.

`url` is a plain string, which is what allows the twelve existing images under
`public/images/properties/` to keep working unchanged while new uploads point at
Supabase Storage.

### `projects`

Construction projects. Carries both offers.

| Column | Type | Notes |
|---|---|---|
| `slug` | text unique | |
| `title_bs`, `title_en`, `description_bs`, `description_en` | text | |
| `location` | text | |
| `status` | text | `planning` \| `under_construction` \| `completed` |
| `progress_percent` | int, 0–100 | drives the animation |
| `start_date`, `expected_completion` | date | |
| `total_units`, `available_units` | int | |
| `price_per_m2` | numeric(10,2) | off-plan offer |
| `min_investment` | numeric(12,2) | investment offer |
| `expected_return_percent` | numeric(5,2) | investment offer |
| `funding_goal`, `funded_amount` | numeric(14,2) | funding bar |
| `offers_offplan`, `offers_investment` | bool | which CTAs render |
| `is_published`, `sort_order` | | |

### `project_images`, `project_milestones`

Images mirror `property_images`. Milestones carry `title_bs/en`,
`description_bs/en`, `target_date`, `completed_at`, `is_done`, `sort_order` — real
construction stages that also feed the scroll animation.

### `reservations`

Bookings and owner-blocked periods share one table so a single database constraint
covers both. A booking cannot overlap another booking *or* a maintenance block.

```sql
create extension if not exists btree_gist;

create table reservations (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references properties(id) on delete cascade,
  period daterange not null,
  kind text not null check (kind in ('booking', 'block')),
  status text not null default 'confirmed' check (status in ('confirmed', 'cancelled')),
  guest_name text, guest_email text, guest_phone text, guests int, message text,
  reason text,
  total_price numeric(10,2),
  ip inet,
  created_at timestamptz default now(),
  cancelled_at timestamptz,
  constraint no_overlap exclude using gist (
    property_id with =, period with &&
  ) where (status = 'confirmed')
);
```

`total_price` is computed at insert time as `price_per_night x nights` and stored, so
a later price change never rewrites what a guest was quoted.

**`period` is half-open, `[check_in, check_out)`.** A guest leaving on the 10th and
another arriving on the 10th do not conflict, which is how hotel nights actually work.

The exclusion constraint is the only thing preventing double-booking. Application code
must never "check then insert" — it inserts and handles the unique-violation error.
Under concurrency a check-then-insert has a gap; the constraint does not.

### `requests`

The three approval-based flows.

| Column | Notes |
|---|---|
| `kind` | `purchase` \| `offplan` \| `investment` |
| `property_id` | set for `purchase` |
| `project_id` | set for `offplan` and `investment` |
| `name`, `email`, `phone`, `message` | |
| `amount` | offer amount or investment amount |
| `units` | off-plan: how many units |
| `status` | `new` \| `contacted` \| `confirmed` \| `rejected` |
| `admin_notes` | private, never shown publicly |
| `ip` | abuse tracing |

Constraint: `purchase` requires `property_id`; `offplan` and `investment` require
`project_id`.

Approving a request does **not** change project numbers automatically. `funded_amount`
and `available_units` stay owner-edited in the admin panel, because real money arrives
and contracts get signed offline, on a different schedule from the button click.

### `site_stats`

Single row, editable in the admin panel: `projects_completed`, `sqm_delivered`,
`investors_count`, `years_experience`. These feed the animated counters. They are
owner-entered rather than computed, because computed values would read as zero at
launch and understate a company that has been building for years.

### Row-level security

RLS is enabled on every table.

- **anon** may `SELECT`: published properties, their images; published projects, their
  images and milestones; `site_stats`; and the `public_availability` view
  (`property_id`, `period` for confirmed reservations only — no guest data).
- **anon** has no `INSERT`, `UPDATE`, or `DELETE` on any table.
- **authenticated** does *not* automatically get write access. Write policies check
  membership in an `admins` table:

  ```sql
  create table admins (email text primary key);

  create policy admin_write on properties for all
    using (exists (select 1 from admins where email = auth.jwt() ->> 'email'));
  ```

  Granting writes to the `authenticated` role alone would be a privilege-escalation
  hole: Supabase Auth accepts signups through the anon key by default, so anyone could
  register themselves into `authenticated` and write directly to Postgres, bypassing
  the app entirely. The `ADMIN_EMAILS` check guards `/admin` pages but not the database
  API, so the database must enforce this itself.

- **Email signups are disabled** in Supabase Auth settings as a second layer. The admin
  account is created by hand in the dashboard. Belt and braces: even if signups were
  re-enabled by accident, the `admins` table still blocks writes.

- **Storage buckets** are public-read and write-restricted to the service role.
  Uploads go through a server action; the browser never writes to Storage directly.

- Public booking submissions are inserted by the server route with the service-role
  key after validation, not by the browser.

## 4. Public site

### Homepage

Order becomes Hero → Features → Properties → **Investing & Building** → About →
Contact → Footer. `components/Properties.tsx` stops holding a hardcoded array and
becomes a server component reading featured, published properties.

### New pages

- `/[locale]/properties` — all published properties, filterable by type, location, and
  sale/rent.
- `/[locale]/properties/[slug]` — gallery, price, m², rooms, features. Buttons follow
  `listing_mode`: **Rezerviši** for rent, **Pošalji ponudu** for sale, both for `both`.
- `/[locale]/invest` — published construction projects with progress.
- `/[locale]/invest/[slug]` — project detail, milestone timeline, animated progress,
  and up to two CTAs: **Kupi u izgradnji** (shows price per m²) and **Investiraj**
  (shows minimum investment and expected return), each rendered only if its
  `offers_*` flag is on.

`app/sitemap.ts` is extended to include every published property and project.

### Booking flow (instant)

1. The property page renders a calendar (`react-day-picker`) with already-taken dates
   disabled, read from `public_availability`.
2. The guest picks dates and submits name, email, phone, and guest count.
3. `POST /api/bookings` validates, then inserts. On exclusion-constraint violation it
   returns **409** with "those dates were just taken" and the calendar refetches.
4. On success the dates are locked immediately. The guest sees a confirmation and
   receives an email; the owner receives a notification email.

Guards, since no human approves before the lock: no past dates, minimum 1 night,
maximum 30 nights, maximum 365 days ahead, and a rate limit of 5 submissions per email
and 15 per IP per hour, counted from `reservations` and `requests`.

Cancelling a booking in the admin panel sets `status = 'cancelled'`, which drops it out
of the exclusion constraint and frees the dates the same second.

### Request flow (purchase, off-plan, investment)

`POST /api/requests` validates, inserts with `status = 'new'`, emails the owner, and
shows the customer a confirmation. No dates are locked and nothing is committed.

### Email

`lib/email.ts` centralizes Resend templates: contact (moved from
`app/api/contact/route.ts`), booking confirmation to guest, booking notification to
owner, and request notification to owner. The existing contact route is refactored onto
it rather than left as a fourth copy of the same HTML.

## 5. Admin panel (`/admin`, Bosnian)

| Route | Purpose |
|---|---|
| `/admin/login` | Email and password. No signup, no reset link, no hints on failure. |
| `/admin` | Counts: new requests, upcoming bookings, published properties, active projects. |
| `/admin/properties` | Table with publish toggle; create/edit form; photo upload with drag-to-reorder; delete behind a confirm step. |
| `/admin/projects` | Same, plus progress slider and milestone editor. |
| `/admin/reservations` | Calendar and list per property. Cancel a booking, or block dates for maintenance or personal use. |
| `/admin/requests` | Inbox filtered by kind and status. Full customer detail, status transitions `new → contacted → confirmed/rejected`, private notes. |
| `/admin/stats` | The four counter numbers. |

Writes use Next.js **server actions** in `app/admin/_actions/`, each re-checking the
admin session server-side. A server action that trusts the client's claim of being
logged in is a hole; each one verifies independently.

## 6. The "Investing & Building" section

The visual centrepiece, at `components/InvestBuild/`.

**A building that constructs itself as the visitor scrolls.** An SVG building on the
left rises floor by floor as scroll progresses through the section: foundation,
structure, facade, windows lighting one by one, finished roof. It is bound to scroll
position, not to a timer, so the visitor builds it. Scrolling back up un-builds it.

On the right, the milestone matching the current stage slides in with its date and
done state, read from `project_milestones`.

**Which project the homepage section uses:** the first published project with status
`under_construction`, ordered by `sort_order`. If no project is under construction, the
section falls back to generic stage labels from the translation files, so it never
renders empty. On `/[locale]/invest/[slug]` the section always uses that page's own
project.

Below: three counters (`projects_completed`, `sqm_delivered`, `investors_count`) count
up when scrolled into view, and each active project shows a ring filling to its real
`progress_percent`.

Implementation notes:

- `framer-motion` is already a dependency and currently unused. `useScroll` +
  `useTransform` drive the building; `whileInView` drives counters and rings.
- Under `prefers-reduced-motion`, the building renders complete and counters show final
  values — no motion, same information.
- With JavaScript disabled the section is still readable: the SVG renders finished and
  milestones render as a plain list.
- Animation runs on `transform` and `opacity` only, so it stays smooth on phones.

## 7. Internationalization

New keys are added to `messages/bs.json` and `messages/en.json` for properties, invest,
booking, forms, and the animated section. Database-driven content uses the `_bs`/`_en`
column pairs selected by the active locale. The admin panel has no translation keys.

## 8. Testing

The repository has no test setup today. Vitest is added, kept narrow and aimed at the
three places where a bug costs real money or leaks data:

1. **Date logic** — half-open range construction, overlap detection, and the min/max
   stay and lead-time guards.
2. **Validation and API routes** — `/api/bookings` and `/api/requests` against a mocked
   Supabase client, including the 409 double-booking path and the rate limiter.
3. **Admin auth guard** — a request without a session, and one with a session whose
   email is absent from `ADMIN_EMAILS`, are both rejected.

Pages and animations are verified in the browser, not unit-tested.

## 9. Environment variables

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=      # server only, never in a client component
ADMIN_EMAILS=                   # comma-separated
RESEND_API_KEY=                 # already present
CONTACT_EMAIL=realestatebenco@gmail.com
NEXT_PUBLIC_SITE_URL=
```

`.env.local` stays gitignored. `.env.example` is added so the required names are
documented.

## 10. Data migration

A seed script inserts the six properties currently hardcoded in
`components/Properties.tsx`, with `url` values pointing at the existing
`public/images/properties/` files, plus one example construction project with
milestones so the animated section has data on first run. No images are moved.

## 11. Out of scope

Deliberately excluded, to be reconsidered only when a real need appears:

- Customer accounts, login, and personal dashboards
- Online payments of any kind
- Multiple admin users and role permissions
- iCal or Airbnb/Booking.com calendar sync
- A translated admin panel
- Reviews, ratings, live chat, generated PDF contracts

## 12. Implementation phases

1. **Foundation** — Supabase project, schema migrations, RLS policies, typed client,
   seed script. Public pages read properties from the database instead of the hardcoded
   array.
2. **Admin panel** — login, auth guard, properties CRUD with photo upload, projects CRUD
   with milestones, stats editor.
3. **Customer flows** — property and project detail pages, booking calendar with the
   instant-lock route, purchase/off-plan/investment requests, emails, admin inbox and
   reservation management.
4. **Animation** — the Investing & Building section, counters, progress rings, reduced-
   motion and no-JavaScript fallbacks.

Each phase leaves the site deployable. Phase 1 alone already replaces hardcoded
properties with managed data.
