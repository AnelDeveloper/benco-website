# Ben&Co Phase 1: Data Foundation — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the hardcoded property array in `components/Properties.tsx` with a Supabase-backed data layer, so the homepage renders real database rows.

**Architecture:** A Supabase Postgres schema (properties, projects, reservations, requests) with row-level security that lets anonymous visitors read only published rows. Next.js server components read through a small typed data layer. Writes are impossible from the browser by design — they arrive in Phase 2 through server actions using the service-role key.

**Tech Stack:** Next.js 15 (App Router, React 19), TypeScript strict, `@supabase/supabase-js`, `zod`, Vitest, Tailwind 3.4, next-intl.

**Spec:** `docs/superpowers/specs/2026-09-22-benco-platform-design.md`

## Global Constraints

- Locales are `bs` (default, no URL prefix) and `en`. Public content is bilingual via `_bs`/`_en` column pairs.
- Default currency is `BAM`.
- `SUPABASE_SERVICE_ROLE_KEY` must never be imported into a client component or any file without `import 'server-only'`.
- Anonymous database access is read-only, and only for rows where `is_published = true`.
- Date ranges are half-open: `[check_in, check_out)`.
- TypeScript is `strict`. No `any` in committed code except inside test fakes.
- The build must succeed with no Supabase environment variables set. Data functions return empty arrays on failure rather than throwing — the repo already hit this class of bug in commit `97cb747`.
- Path alias `@/*` maps to the repo root.

---

### Task 1: Test harness and environment helper

**Files:**
- Create: `vitest.config.ts`
- Create: `lib/env.ts`
- Create: `lib/env.test.ts`
- Create: `.env.example`
- Modify: `package.json` (scripts + devDependencies)

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `requireEnv(name, source?): string` — returns the value, or throws an `Error` naming the missing variable.
  - `optionalEnv(name, source?): string | null` — returns the value or `null`, never throws. Task 3 uses this for the public client so builds without Supabase succeed.

- [ ] **Step 1: Install dependencies**

```bash
npm install @supabase/supabase-js zod server-only
npm install -D vitest @vitejs/plugin-react tsx
```

- [ ] **Step 2: Add the test script**

In `package.json`, add to `"scripts"`:

```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 3: Create `vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'node',
    include: ['**/*.test.ts', '**/*.test.tsx'],
    exclude: ['node_modules/**', '.next/**'],
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, '.') },
  },
});
```

- [ ] **Step 4: Write the failing test**

Create `lib/env.test.ts`:

```ts
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
```

- [ ] **Step 5: Run the test and confirm it fails**

Run: `npm test -- lib/env.test.ts`
Expected: FAIL — `Failed to resolve import "./env"`.

- [ ] **Step 6: Write the implementation**

Create `lib/env.ts`:

```ts
type EnvSource = Record<string, string | undefined>;

export function requireEnv(name: string, source: EnvSource = process.env): string {
  const value = source[name];
  if (value === undefined || value.trim() === '') {
    throw new Error(
      `Missing required environment variable: ${name}. Add it to .env.local (see .env.example).`,
    );
  }
  return value;
}

export function optionalEnv(name: string, source: EnvSource = process.env): string | null {
  const value = source[name];
  return value === undefined || value.trim() === '' ? null : value;
}
```

- [ ] **Step 7: Run the test and confirm it passes**

Run: `npm test -- lib/env.test.ts`
Expected: PASS, 4 tests.

- [ ] **Step 8: Create `.env.example`**

```bash
# Supabase — from https://supabase.com/dashboard → Project Settings → API
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# Server only. Never expose this to the browser.
SUPABASE_SERVICE_ROLE_KEY=

# Comma-separated list of emails allowed into /admin
ADMIN_EMAILS=

# Email (already in use by the contact form)
RESEND_API_KEY=
CONTACT_EMAIL=realestatebenco@gmail.com

# Absolute site URL, used in emails and sitemap
NEXT_PUBLIC_SITE_URL=https://benco.ba
```

- [ ] **Step 9: Verify `.env.example` is not ignored**

Run: `git check-ignore -v .env.example`
Expected: no output and exit code 1. The existing `.gitignore` has `.env*.local` and `.env`, so `.env.example` is safe to commit. If it IS ignored, add `!.env.example` to `.gitignore`.

- [ ] **Step 10: Commit**

```bash
git add vitest.config.ts lib/env.ts lib/env.test.ts .env.example package.json package-lock.json
git commit -m "test: add vitest harness and environment variable helper"
```

---

### Task 2: Database schema and row-level security

**Files:**
- Create: `supabase/migrations/0001_initial_schema.sql`
- Create: `supabase/migrations/0002_row_level_security.sql`
- Create: `supabase/README.md`

**Interfaces:**
- Consumes: nothing.
- Produces: tables `admins`, `properties`, `property_images`, `projects`, `project_images`, `project_milestones`, `reservations`, `requests`, `site_stats`; view `public_availability`; function `is_admin()`.

This task has no unit tests — it is SQL applied to a hosted database. Verification is a set of SQL assertions in Step 5 that must return the stated results.

- [ ] **Step 1: Create the schema migration**

Create `supabase/migrations/0001_initial_schema.sql`:

```sql
create extension if not exists "pgcrypto";
create extension if not exists btree_gist;

-- Shared updated_at trigger
create or replace function set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Who may administer the site. Checked by RLS, not just by the app.
create table admins (
  email text primary key,
  created_at timestamptz not null default now()
);

create table properties (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title_bs text not null,
  title_en text not null,
  description_bs text,
  description_en text,
  property_type text not null check (property_type in ('villa', 'apartment', 'house', 'land')),
  listing_mode text not null check (listing_mode in ('sale', 'rent', 'both')),
  location text not null,
  address text,
  price numeric(12, 2),
  price_per_night numeric(10, 2),
  currency text not null default 'BAM',
  area_m2 numeric(8, 2),
  bedrooms int,
  bathrooms int,
  max_guests int,
  features text[] not null default '{}',
  is_published boolean not null default false,
  is_featured boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index properties_published_idx on properties (is_published, sort_order);
create trigger properties_set_updated_at before update on properties
  for each row execute function set_updated_at();

create table property_images (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references properties(id) on delete cascade,
  url text not null,
  alt_bs text,
  alt_en text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create index property_images_property_idx on property_images (property_id, sort_order);

create table projects (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title_bs text not null,
  title_en text not null,
  description_bs text,
  description_en text,
  location text not null,
  status text not null check (status in ('planning', 'under_construction', 'completed')),
  progress_percent int not null default 0 check (progress_percent between 0 and 100),
  start_date date,
  expected_completion date,
  total_units int,
  available_units int,
  price_per_m2 numeric(10, 2),
  currency text not null default 'BAM',
  min_investment numeric(12, 2),
  expected_return_percent numeric(5, 2),
  funding_goal numeric(14, 2),
  funded_amount numeric(14, 2) not null default 0,
  offers_offplan boolean not null default true,
  offers_investment boolean not null default true,
  is_published boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index projects_published_idx on projects (is_published, sort_order);
create trigger projects_set_updated_at before update on projects
  for each row execute function set_updated_at();

create table project_images (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  url text not null,
  alt_bs text,
  alt_en text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table project_milestones (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  title_bs text not null,
  title_en text not null,
  description_bs text,
  description_en text,
  target_date date,
  completed_at date,
  is_done boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create index project_milestones_project_idx on project_milestones (project_id, sort_order);

-- Bookings and owner-blocked periods share one table so a single exclusion
-- constraint prevents a booking from overlapping either another booking or a block.
create table reservations (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references properties(id) on delete cascade,
  period daterange not null,
  kind text not null check (kind in ('booking', 'block')),
  status text not null default 'confirmed' check (status in ('confirmed', 'cancelled')),
  guest_name text,
  guest_email text,
  guest_phone text,
  guests int,
  message text,
  reason text,
  total_price numeric(10, 2),
  ip inet,
  created_at timestamptz not null default now(),
  cancelled_at timestamptz,
  constraint reservations_no_overlap exclude using gist (
    property_id with =,
    period with &&
  ) where (status = 'confirmed')
);

create index reservations_property_idx on reservations (property_id, status);

create table requests (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('purchase', 'offplan', 'investment')),
  property_id uuid references properties(id) on delete set null,
  project_id uuid references projects(id) on delete set null,
  name text not null,
  email text not null,
  phone text,
  message text,
  amount numeric(14, 2),
  units int,
  status text not null default 'new' check (status in ('new', 'contacted', 'confirmed', 'rejected')),
  admin_notes text,
  ip inet,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint requests_target_matches_kind check (
    (kind = 'purchase' and property_id is not null)
    or (kind in ('offplan', 'investment') and project_id is not null)
  )
);

create index requests_status_idx on requests (status, created_at desc);
create trigger requests_set_updated_at before update on requests
  for each row execute function set_updated_at();

-- Single-row table: the boolean primary key defaulting to true, with a check
-- that it IS true, makes a second row impossible.
create table site_stats (
  id boolean primary key default true check (id),
  projects_completed int not null default 0,
  sqm_delivered int not null default 0,
  investors_count int not null default 0,
  years_experience int not null default 0,
  updated_at timestamptz not null default now()
);

create trigger site_stats_set_updated_at before update on site_stats
  for each row execute function set_updated_at();

-- Storage for admin-uploaded photos. Public read; writes only via service role.
insert into storage.buckets (id, name, public)
values ('property-images', 'property-images', true), ('project-images', 'project-images', true)
on conflict (id) do nothing;
```

- [ ] **Step 2: Create the security migration**

Create `supabase/migrations/0002_row_level_security.sql`:

```sql
-- security definer so the check can read `admins` even though anon cannot.
create or replace function is_admin() returns boolean as $$
  select exists (
    select 1 from admins where email = auth.jwt() ->> 'email'
  );
$$ language sql stable security definer set search_path = public;

alter table admins enable row level security;
alter table properties enable row level security;
alter table property_images enable row level security;
alter table projects enable row level security;
alter table project_images enable row level security;
alter table project_milestones enable row level security;
alter table reservations enable row level security;
alter table requests enable row level security;
alter table site_stats enable row level security;

-- Public read: published rows only.
create policy properties_public_read on properties
  for select to anon, authenticated using (is_published);

create policy property_images_public_read on property_images
  for select to anon, authenticated using (
    exists (select 1 from properties p where p.id = property_id and p.is_published)
  );

create policy projects_public_read on projects
  for select to anon, authenticated using (is_published);

create policy project_images_public_read on project_images
  for select to anon, authenticated using (
    exists (select 1 from projects p where p.id = project_id and p.is_published)
  );

create policy project_milestones_public_read on project_milestones
  for select to anon, authenticated using (
    exists (select 1 from projects p where p.id = project_id and p.is_published)
  );

create policy site_stats_public_read on site_stats
  for select to anon, authenticated using (true);

-- Admin full access. Note this is gated on the admins table, NOT merely on
-- being authenticated: Supabase Auth accepts signups through the anon key by
-- default, so `to authenticated using (true)` would let anyone who registers
-- write directly to Postgres, bypassing the app entirely.
create policy properties_admin_all on properties
  for all to authenticated using (is_admin()) with check (is_admin());
create policy property_images_admin_all on property_images
  for all to authenticated using (is_admin()) with check (is_admin());
create policy projects_admin_all on projects
  for all to authenticated using (is_admin()) with check (is_admin());
create policy project_images_admin_all on project_images
  for all to authenticated using (is_admin()) with check (is_admin());
create policy project_milestones_admin_all on project_milestones
  for all to authenticated using (is_admin()) with check (is_admin());
create policy reservations_admin_all on reservations
  for all to authenticated using (is_admin()) with check (is_admin());
create policy requests_admin_all on requests
  for all to authenticated using (is_admin()) with check (is_admin());
create policy site_stats_admin_all on site_stats
  for all to authenticated using (is_admin()) with check (is_admin());

-- Availability must be public, but guest names, emails and phone numbers must not be.
-- A view without security_invoker reads with the owner's rights, so it returns
-- these two columns while `reservations` itself stays unreadable to anon.
create view public_availability as
  select property_id, period from reservations where status = 'confirmed';

grant select on public_availability to anon, authenticated;
```

- [ ] **Step 3: Write the apply instructions**

Create `supabase/README.md`:

```markdown
# Database

Schema lives in `migrations/`, applied in filename order.

## First-time setup

1. Create a project at https://supabase.com/dashboard (free tier is enough).
2. Project Settings → API: copy the Project URL, the `anon` key, and the
   `service_role` key into `.env.local` (see `.env.example`).
3. **Authentication → Providers → Email: turn OFF "Enable Sign Ups".**
   Without this, anyone can register an account. RLS still blocks them from
   writing, but there is no reason to allow the accounts to exist.
4. Apply the migrations — either paste each file into the SQL Editor in
   filename order, or use the CLI:

   ```bash
   npx supabase link --project-ref <your-project-ref>
   npx supabase db push
   ```

5. Create your admin user: Authentication → Users → Add user (email +
   password, "Auto Confirm User" on).
6. Authorize that user in the SQL Editor:

   ```sql
   insert into admins (email) values ('your@email.com');
   ```

   Both steps are required. The Supabase user can log in; the `admins` row is
   what grants database access.
```

- [ ] **Step 4: Apply the migrations**

Follow `supabase/README.md` steps 1–6 against a real Supabase project.

- [ ] **Step 5: Verify the security actually holds**

In the Supabase SQL Editor, run each check and confirm the stated result:

```sql
-- a) All nine tables exist
select count(*) from information_schema.tables
where table_schema = 'public'
  and table_name in ('admins','properties','property_images','projects',
    'project_images','project_milestones','reservations','requests','site_stats');
-- Expected: 9

-- b) RLS is on everywhere
select count(*) from pg_tables
where schemaname = 'public' and rowsecurity = false;
-- Expected: 0

-- c) The overlap constraint really rejects a double booking
insert into properties (slug, title_bs, title_en, property_type, listing_mode, location, is_published)
values ('rls-test', 'Test', 'Test', 'apartment', 'rent', 'Sarajevo', true);

insert into reservations (property_id, period, kind, guest_name)
select id, daterange('2026-07-01', '2026-07-10', '[)'), 'booking', 'Prvi'
from properties where slug = 'rls-test';

insert into reservations (property_id, period, kind, guest_name)
select id, daterange('2026-07-05', '2026-07-12', '[)'), 'booking', 'Drugi'
from properties where slug = 'rls-test';
-- Expected: ERROR "conflicting key value violates exclusion constraint"

-- d) Back-to-back stays do NOT conflict (half-open ranges)
insert into reservations (property_id, period, kind, guest_name)
select id, daterange('2026-07-10', '2026-07-15', '[)'), 'booking', 'Treci'
from properties where slug = 'rls-test';
-- Expected: INSERT 0 1

-- e) Clean up
delete from properties where slug = 'rls-test';
```

- [ ] **Step 6: Verify anonymous access is read-only and published-only**

In a terminal, using your **anon** key (not service role):

```bash
# Reading published rows works
curl -s "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/properties?select=slug" \
  -H "apikey: $NEXT_PUBLIC_SUPABASE_ANON_KEY"
# Expected: [] or only published rows

# Writing is refused
curl -s -X POST "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/properties" \
  -H "apikey: $NEXT_PUBLIC_SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"slug":"hack","title_bs":"x","title_en":"x","property_type":"villa","listing_mode":"sale","location":"x"}'
# Expected: 401 or 403 with "violates row-level security policy"

# Guest data is not exposed
curl -s "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/reservations?select=guest_email" \
  -H "apikey: $NEXT_PUBLIC_SUPABASE_ANON_KEY"
# Expected: [] — never a list of emails
```

If the write succeeds, stop and fix the policies before continuing. This is the single most important check in Phase 1.

- [ ] **Step 7: Commit**

```bash
git add supabase/
git commit -m "feat: add database schema and row-level security policies"
```

---

### Task 3: Typed Supabase clients

**Files:**
- Create: `lib/supabase/types.ts`
- Create: `lib/supabase/anon.ts`
- Create: `lib/supabase/admin.ts`

**Interfaces:**
- Consumes: `requireEnv` from `lib/env.ts`.
- Produces:
  - `type Database` and row types `PropertyRow`, `PropertyImageRow`, `ProjectRow`, `ProjectMilestoneRow`, `SiteStatsRow`
  - `createAnonClient(): SupabaseClient<Database> | null` — returns `null` when env vars are absent, so builds without Supabase still succeed
  - `createAdminClient(): SupabaseClient<Database>` — service role, throws if env is missing

- [ ] **Step 1: Define the row types**

Create `lib/supabase/types.ts`:

```ts
export type PropertyType = 'villa' | 'apartment' | 'house' | 'land';
export type ListingMode = 'sale' | 'rent' | 'both';
export type ProjectStatus = 'planning' | 'under_construction' | 'completed';

export type PropertyRow = {
  id: string;
  slug: string;
  title_bs: string;
  title_en: string;
  description_bs: string | null;
  description_en: string | null;
  property_type: PropertyType;
  listing_mode: ListingMode;
  location: string;
  address: string | null;
  price: number | null;
  price_per_night: number | null;
  currency: string;
  area_m2: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  max_guests: number | null;
  features: string[];
  is_published: boolean;
  is_featured: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type PropertyImageRow = {
  id: string;
  property_id: string;
  url: string;
  alt_bs: string | null;
  alt_en: string | null;
  sort_order: number;
  created_at: string;
};

export type ProjectRow = {
  id: string;
  slug: string;
  title_bs: string;
  title_en: string;
  description_bs: string | null;
  description_en: string | null;
  location: string;
  status: ProjectStatus;
  progress_percent: number;
  start_date: string | null;
  expected_completion: string | null;
  total_units: number | null;
  available_units: number | null;
  price_per_m2: number | null;
  currency: string;
  min_investment: number | null;
  expected_return_percent: number | null;
  funding_goal: number | null;
  funded_amount: number;
  offers_offplan: boolean;
  offers_investment: boolean;
  is_published: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type ProjectMilestoneRow = {
  id: string;
  project_id: string;
  title_bs: string;
  title_en: string;
  description_bs: string | null;
  description_en: string | null;
  target_date: string | null;
  completed_at: string | null;
  is_done: boolean;
  sort_order: number;
  created_at: string;
};

export type SiteStatsRow = {
  id: boolean;
  projects_completed: number;
  sqm_delivered: number;
  investors_count: number;
  years_experience: number;
  updated_at: string;
};

/**
 * `Relationships` is required by postgrest-js's GenericTable constraint. Omit it
 * and the schema silently fails the constraint, which makes every insert payload
 * resolve to `never` — an error that surfaces far from its cause.
 */
type Table<Row> = {
  Row: Row;
  Insert: Partial<Row>;
  Update: Partial<Row>;
  Relationships: [];
};

export type Database = {
  public: {
    Tables: {
      properties: Table<PropertyRow>;
      property_images: Table<PropertyImageRow>;
      projects: Table<ProjectRow>;
      project_milestones: Table<ProjectMilestoneRow>;
      site_stats: Table<SiteStatsRow>;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
```

- [ ] **Step 2: Create the anonymous client**

Create `lib/supabase/anon.ts`:

```ts
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { optionalEnv } from '@/lib/env';
import type { Database } from './types';

/**
 * Read-only client for public data.
 *
 * Returns null instead of throwing when Supabase is not configured, so that
 * `next build` succeeds in an environment without secrets. Callers treat null
 * as "no data available".
 */
export function createAnonClient(): SupabaseClient<Database> | null {
  const url = optionalEnv('NEXT_PUBLIC_SUPABASE_URL');
  const key = optionalEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY');
  if (!url || !key) return null;

  return createClient<Database>(url, key, {
    auth: { persistSession: false },
  });
}
```

- [ ] **Step 3: Create the service-role client**

Create `lib/supabase/admin.ts`:

```ts
import 'server-only';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { requireEnv } from '@/lib/env';
import type { Database } from './types';

/**
 * Full-access client. Bypasses row-level security.
 *
 * The `server-only` import above makes the build fail if this file is ever
 * reached from a client component, which is the guardrail that keeps the
 * service-role key out of the browser bundle.
 */
export function createAdminClient(): SupabaseClient<Database> {
  return createClient<Database>(
    requireEnv('NEXT_PUBLIC_SUPABASE_URL'),
    requireEnv('SUPABASE_SERVICE_ROLE_KEY'),
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
```

- [ ] **Step 4: Verify it type-checks**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add lib/supabase/
git commit -m "feat: add typed Supabase clients for public and admin access"
```

---

### Task 4: Localized field helper

**Files:**
- Create: `lib/localized.ts`
- Create: `lib/localized.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `type Locale = 'bs' | 'en'` and `localized(row, field, locale): string` — reads `${field}_${locale}`, falling back to `${field}_bs`, then to an empty string.

- [ ] **Step 1: Write the failing test**

Create `lib/localized.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { localized } from './localized';

const row = {
  title_bs: 'Vila sa jezerom',
  title_en: 'Lakeside villa',
  description_bs: 'Opis',
  description_en: null,
  note_bs: null,
  note_en: null,
};

describe('localized', () => {
  it('returns the Bosnian value for locale bs', () => {
    expect(localized(row, 'title', 'bs')).toBe('Vila sa jezerom');
  });

  it('returns the English value for locale en', () => {
    expect(localized(row, 'title', 'en')).toBe('Lakeside villa');
  });

  it('falls back to Bosnian when the English value is null', () => {
    expect(localized(row, 'description', 'en')).toBe('Opis');
  });

  it('falls back to Bosnian when the English value is an empty string', () => {
    expect(localized({ x_bs: 'ima', x_en: '   ' }, 'x', 'en')).toBe('ima');
  });

  it('returns an empty string when neither language has a value', () => {
    expect(localized(row, 'note', 'en')).toBe('');
  });

  it('returns an empty string for a field that does not exist', () => {
    expect(localized(row, 'missing', 'bs')).toBe('');
  });
});
```

- [ ] **Step 2: Run the test and confirm it fails**

Run: `npm test -- lib/localized.test.ts`
Expected: FAIL — `Failed to resolve import "./localized"`.

- [ ] **Step 3: Write the implementation**

Create `lib/localized.ts`:

```ts
export type Locale = 'bs' | 'en';

function asText(value: unknown): string | null {
  return typeof value === 'string' && value.trim() !== '' ? value : null;
}

/**
 * Reads a bilingual column pair, e.g. localized(row, 'title', 'en') reads
 * `title_en` and falls back to `title_bs`. Bosnian is the source language, so
 * a listing with no English translation still renders on the English site.
 */
export function localized(
  row: Record<string, unknown>,
  field: string,
  locale: Locale,
): string {
  return asText(row[`${field}_${locale}`]) ?? asText(row[`${field}_bs`]) ?? '';
}
```

- [ ] **Step 4: Run the test and confirm it passes**

Run: `npm test -- lib/localized.test.ts`
Expected: PASS, 6 tests.

- [ ] **Step 5: Commit**

```bash
git add lib/localized.ts lib/localized.test.ts
git commit -m "feat: add bilingual field helper with Bosnian fallback"
```

---

### Task 5: Property data layer

**Files:**
- Create: `lib/data/properties.ts`
- Create: `lib/data/properties.test.ts`

**Interfaces:**
- Consumes: `localized`, `Locale` from `lib/localized.ts`; `createAnonClient` from `lib/supabase/anon.ts`; `PropertyRow`, `PropertyImageRow` from `lib/supabase/types.ts`.
- Produces:
  - `type PropertyCard`
  - `toPropertyCard(row: PropertyRowWithImages, locale: Locale): PropertyCard`
  - `getFeaturedProperties(locale: Locale, client?): Promise<PropertyCard[]>`

- [ ] **Step 1: Write the failing test**

Create `lib/data/properties.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { getFeaturedProperties, toPropertyCard } from './properties';

const row = {
  id: 'p1',
  slug: 'vila-sa-jezerom',
  title_bs: 'Vila sa jezerom',
  title_en: 'Lakeside villa',
  property_type: 'villa' as const,
  listing_mode: 'sale' as const,
  location: 'Sarajevo',
  price: 450000,
  price_per_night: null,
  currency: 'BAM',
  area_m2: 320,
  bedrooms: 4,
  bathrooms: 3,
  property_images: [
    { url: '/images/b.avif', alt_bs: null, alt_en: null, sort_order: 2 },
    { url: '/images/a.avif', alt_bs: 'Prednja strana', alt_en: 'Front', sort_order: 1 },
  ],
};

/** Minimal stand-in for the Supabase query builder: every method returns the
 *  builder, and awaiting the builder resolves to the canned response. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function fakeClient(data: unknown, error: unknown = null): any {
  const builder: any = {
    select: () => builder,
    eq: () => builder,
    order: () => builder,
    limit: () => builder,
    then: (resolve: (value: unknown) => unknown) => resolve({ data, error }),
  };
  return { from: () => builder };
}

describe('toPropertyCard', () => {
  it('uses the title for the requested locale', () => {
    expect(toPropertyCard(row, 'en').title).toBe('Lakeside villa');
    expect(toPropertyCard(row, 'bs').title).toBe('Vila sa jezerom');
  });

  it('picks the lowest sort_order image as the cover', () => {
    expect(toPropertyCard(row, 'bs').coverImage).toBe('/images/a.avif');
  });

  it('uses the cover image alt text for the requested locale', () => {
    expect(toPropertyCard(row, 'en').coverAlt).toBe('Front');
  });

  it('falls back to the title as alt text when the image has none', () => {
    const noAlt = { ...row, property_images: [{ url: '/x.avif', alt_bs: null, alt_en: null, sort_order: 1 }] };
    expect(toPropertyCard(noAlt, 'bs').coverAlt).toBe('Vila sa jezerom');
  });

  it('returns a null cover when the property has no images', () => {
    expect(toPropertyCard({ ...row, property_images: [] }, 'bs').coverImage).toBeNull();
  });
});

describe('getFeaturedProperties', () => {
  it('maps returned rows to cards', async () => {
    const result = await getFeaturedProperties('bs', fakeClient([row]));
    expect(result).toHaveLength(1);
    expect(result[0].slug).toBe('vila-sa-jezerom');
  });

  it('returns an empty array when Supabase reports an error', async () => {
    const result = await getFeaturedProperties('bs', fakeClient(null, { message: 'boom' }));
    expect(result).toEqual([]);
  });

  it('returns an empty array when no client is configured', async () => {
    const result = await getFeaturedProperties('bs', null);
    expect(result).toEqual([]);
  });
});
```

- [ ] **Step 2: Run the test and confirm it fails**

Run: `npm test -- lib/data/properties.test.ts`
Expected: FAIL — `Failed to resolve import "./properties"`.

- [ ] **Step 3: Write the implementation**

Create `lib/data/properties.ts`:

```ts
import { localized, type Locale } from '@/lib/localized';
import { createAnonClient } from '@/lib/supabase/anon';
import type { ListingMode, PropertyType } from '@/lib/supabase/types';

const CARD_COLUMNS = `
  id, slug, title_bs, title_en, property_type, listing_mode, location,
  price, price_per_night, currency, area_m2, bedrooms, bathrooms,
  property_images (url, alt_bs, alt_en, sort_order)
`;

export type PropertyCard = {
  id: string;
  slug: string;
  title: string;
  propertyType: PropertyType;
  listingMode: ListingMode;
  location: string;
  price: number | null;
  pricePerNight: number | null;
  currency: string;
  areaM2: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  coverImage: string | null;
  coverAlt: string;
};

type ImageLike = {
  url: string;
  alt_bs: string | null;
  alt_en: string | null;
  sort_order: number;
};

type PropertyCardRow = Record<string, unknown> & {
  id: string;
  slug: string;
  property_type: PropertyType;
  listing_mode: ListingMode;
  location: string;
  price: number | null;
  price_per_night: number | null;
  currency: string;
  area_m2: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  property_images?: ImageLike[] | null;
};

export function toPropertyCard(row: PropertyCardRow, locale: Locale): PropertyCard {
  const images = [...(row.property_images ?? [])].sort((a, b) => a.sort_order - b.sort_order);
  const cover = images[0] ?? null;
  const title = localized(row, 'title', locale);

  return {
    id: row.id,
    slug: row.slug,
    title,
    propertyType: row.property_type,
    listingMode: row.listing_mode,
    location: row.location,
    price: row.price,
    pricePerNight: row.price_per_night,
    currency: row.currency,
    areaM2: row.area_m2,
    bedrooms: row.bedrooms,
    bathrooms: row.bathrooms,
    coverImage: cover?.url ?? null,
    coverAlt: cover ? localized(cover, 'alt', locale) || title : title,
  };
}

/**
 * Featured, published properties for the homepage.
 *
 * Never throws: a missing configuration or a failed query yields an empty list
 * so the page still renders and the build still succeeds.
 */
export async function getFeaturedProperties(
  locale: Locale,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  client: any = createAnonClient(),
): Promise<PropertyCard[]> {
  if (!client) return [];

  const { data, error } = await client
    .from('properties')
    .select(CARD_COLUMNS)
    .eq('is_published', true)
    .eq('is_featured', true)
    .order('sort_order', { ascending: true })
    .limit(6);

  if (error || !data) {
    if (error) console.error('getFeaturedProperties failed:', error);
    return [];
  }

  return (data as PropertyCardRow[]).map((row) => toPropertyCard(row, locale));
}
```

- [ ] **Step 4: Run the test and confirm it passes**

Run: `npm test -- lib/data/properties.test.ts`
Expected: PASS, 8 tests.

- [ ] **Step 5: Commit**

```bash
git add lib/data/
git commit -m "feat: add property data layer with locale-aware card mapping"
```

---

### Task 6: Seed the existing properties

**Files:**
- Create: `scripts/seed.ts`
- Modify: `package.json` (add `"seed"` script)

**Interfaces:**
- Consumes: row types from `lib/supabase/types.ts`.
- Produces: four properties with their images, one construction project with five milestones, and one `site_stats` row.

**Why this script builds its own client** instead of importing `createAdminClient`:
`lib/supabase/admin.ts` starts with `import 'server-only'`, a package that
deliberately throws outside the React Server Component environment. Next.js
supplies the condition that makes it resolve harmlessly; plain Node running under
`tsx` does not, so importing it here would crash on startup. Keeping the guardrail
in `admin.ts` is worth the six duplicated lines below.

The homepage currently shows six cards, but they reuse the same two villas. The real inventory in `public/images/properties/` is four distinct properties, so that is what gets seeded — each with all of its photos instead of one repeated card.

Prices, descriptions, and room counts below are starting values; the owner corrects them in the admin panel in Phase 2. Image paths stay as the existing files under `public/`, so nothing needs to be uploaded or moved.

- [ ] **Step 1: Add the seed script entry**

In `package.json`, add to `"scripts"`:

```json
"seed": "tsx scripts/seed.ts"
```

- [ ] **Step 2: Write the seed script**

Create `scripts/seed.ts`:

```ts
/**
 * Seeds the database with the properties that were previously hardcoded in
 * components/Properties.tsx, plus one example construction project.
 *
 * Idempotent: deletes rows with the same slugs first, so it can be re-run.
 * Run with: npm run seed
 */
import { config } from 'dotenv';
config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';
import type { Database, ProjectMilestoneRow, ProjectRow, PropertyRow } from '../lib/supabase/types';

function serviceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local');
  }
  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** Seed rows are partial: every column not listed takes its database default. */
type SeedProperty = Partial<PropertyRow> & { slug: string; title_bs: string; images: string[] };

const properties: SeedProperty[] = [
  {
    slug: 'vila-sa-jezerom',
    title_bs: 'Vila sa jezerom',
    title_en: 'Lakeside villa',
    description_bs: 'Luksuzna vila sa pogledom na jezero, u mirnom okruženju nadomak Sarajeva.',
    description_en: 'Luxury villa overlooking the lake, in quiet surroundings near Sarajevo.',
    property_type: 'villa',
    listing_mode: 'sale',
    location: 'Sarajevo',
    price: 450000,
    currency: 'BAM',
    area_m2: 320,
    bedrooms: 4,
    bathrooms: 3,
    features: ['jezero', 'garaža', 'vrt', 'terasa'],
    is_published: true,
    is_featured: true,
    sort_order: 1,
    images: [
      'Vila sa jezerom 1.avif',
      'Vila sa jezerom 2.avif',
      'Vila sa jezerom 3.avif',
      'Vila sa jezerom 4.avif',
    ],
  },
  {
    slug: 'vila-sa-bazenom',
    title_bs: 'Vila sa bazenom',
    title_en: 'Villa with pool',
    description_bs: 'Moderna vila sa vlastitim bazenom i prostranim dvorištem.',
    description_en: 'Modern villa with a private pool and a spacious yard.',
    property_type: 'villa',
    listing_mode: 'both',
    location: 'Sarajevo',
    price: 520000,
    price_per_night: 450,
    currency: 'BAM',
    area_m2: 380,
    bedrooms: 5,
    bathrooms: 4,
    max_guests: 10,
    features: ['bazen', 'garaža', 'vrt', 'roštilj'],
    is_published: true,
    is_featured: true,
    sort_order: 2,
    images: [
      'Villa sa bazenom 1.avif',
      'Villa sa bazenom 2.avif',
      'Villa sa bazenom 3.avif',
      'Vila sa bazenom 4.avif',
    ],
  },
  {
    slug: 'apartman-dacha',
    title_bs: 'Apartman Dacha',
    title_en: 'Dacha apartment',
    description_bs: 'Ugodan apartman u srcu Sarajeva, idealan za kraći boravak.',
    description_en: 'A comfortable apartment in the heart of Sarajevo, ideal for short stays.',
    property_type: 'apartment',
    listing_mode: 'rent',
    location: 'Sarajevo',
    price_per_night: 180,
    currency: 'BAM',
    area_m2: 65,
    bedrooms: 2,
    bathrooms: 1,
    max_guests: 4,
    features: ['wifi', 'parking', 'klima'],
    is_published: true,
    is_featured: true,
    sort_order: 3,
    images: ['Apartman Dacha 1.jpeg', 'Apartman Dacha 2.avif'],
  },
  {
    slug: 'apartman-jahorina',
    title_bs: 'Apartman Jahorina',
    title_en: 'Jahorina apartment',
    description_bs: 'Planinski apartman na Jahorini, nekoliko minuta od ski staza.',
    description_en: 'Mountain apartment on Jahorina, minutes from the ski slopes.',
    property_type: 'apartment',
    listing_mode: 'rent',
    location: 'Jahorina',
    price_per_night: 220,
    currency: 'BAM',
    area_m2: 58,
    bedrooms: 2,
    bathrooms: 1,
    max_guests: 5,
    features: ['ski', 'parking', 'kamin'],
    is_published: true,
    is_featured: true,
    sort_order: 4,
    images: ['Jahorina apartman1.avif', 'Jahorina apartman 2.avif'],
  },
];

const project: Partial<ProjectRow> = {
  slug: 'stambeni-objekat-stup',
  title_bs: 'Stambeni objekat Stup',
  title_en: 'Stup residential building',
  description_bs: 'Stambeni objekat sa 24 stana, u izgradnji. Mogućnost kupovine u izgradnji ili ulaganja u projekat.',
  description_en: 'A 24-unit residential building under construction. Buy off-plan or invest in the project.',
  location: 'Stup, Sarajevo',
  status: 'under_construction',
  progress_percent: 45,
  start_date: '2026-03-01',
  expected_completion: '2027-06-30',
  total_units: 24,
  available_units: 11,
  price_per_m2: 3200,
  currency: 'BAM',
  min_investment: 20000,
  expected_return_percent: 12,
  funding_goal: 1800000,
  funded_amount: 640000,
  offers_offplan: true,
  offers_investment: true,
  is_published: true,
  sort_order: 1,
};

const milestones: Partial<ProjectMilestoneRow>[] = [
  { title_bs: 'Zemljište i dozvole', title_en: 'Land and permits', target_date: '2026-03-01', is_done: true, sort_order: 1 },
  { title_bs: 'Temelji', title_en: 'Foundation', target_date: '2026-05-15', is_done: true, sort_order: 2 },
  { title_bs: 'Konstrukcija', title_en: 'Structure', target_date: '2026-10-01', is_done: false, sort_order: 3 },
  { title_bs: 'Fasada i stolarija', title_en: 'Facade and windows', target_date: '2027-02-01', is_done: false, sort_order: 4 },
  { title_bs: 'Unutrašnji radovi i primopredaja', title_en: 'Interior and handover', target_date: '2027-06-30', is_done: false, sort_order: 5 },
];

async function main() {
  const db = serviceClient();

  const propertySlugs = properties.map((p) => p.slug);
  await db.from('properties').delete().in('slug', propertySlugs);
  await db.from('projects').delete().eq('slug', project.slug);

  for (const { images, ...fields } of properties) {
    const { data, error } = await db.from('properties').insert(fields).select('id').single();
    if (error || !data) throw new Error(`Failed to insert ${fields.slug}: ${error?.message}`);

    const imageRows = images.map((file, index) => ({
      property_id: data.id,
      url: `/images/properties/${file}`,
      alt_bs: fields.title_bs,
      alt_en: fields.title_en,
      sort_order: index + 1,
    }));

    const { error: imageError } = await db.from('property_images').insert(imageRows);
    if (imageError) throw new Error(`Failed to insert images for ${fields.slug}: ${imageError.message}`);

    console.log(`  ${fields.slug} (${images.length} images)`);
  }

  const { data: projectRow, error: projectError } = await db
    .from('projects').insert(project).select('id').single();
  if (projectError || !projectRow) throw new Error(`Failed to insert project: ${projectError?.message}`);

  const { error: milestoneError } = await db
    .from('project_milestones')
    .insert(milestones.map((m) => ({ ...m, project_id: projectRow.id })));
  if (milestoneError) throw new Error(`Failed to insert milestones: ${milestoneError.message}`);

  console.log(`  ${project.slug} (${milestones.length} milestones)`);

  const { error: statsError } = await db.from('site_stats').upsert({
    id: true,
    projects_completed: 12,
    sqm_delivered: 18500,
    investors_count: 34,
    years_experience: 10,
  });
  if (statsError) throw new Error(`Failed to upsert site stats: ${statsError.message}`);

  console.log('Seed complete.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
```

- [ ] **Step 3: Install dotenv and type-check the script**

```bash
npm install -D dotenv
npx tsc --noEmit
```

Expected: no errors. `tsconfig.json` includes `**/*.ts`, so `scripts/seed.ts` is
type-checked by `next build` too — a wrong `property_type` literal fails the build,
not the seed run. The explicit `SeedProperty` / `Partial<ProjectRow>` annotations are
what make that check meaningful; without them the literals widen to `string` and the
mistake surfaces only as a database constraint violation.

- [ ] **Step 4: Run the seed**

Run: `npm run seed`
Expected output:

```
  vila-sa-jezerom (4 images)
  vila-sa-bazenom (4 images)
  apartman-dacha (2 images)
  apartman-jahorina (2 images)
  stambeni-objekat-stup (5 milestones)
Seed complete.
```

- [ ] **Step 5: Verify it is idempotent**

Run: `npm run seed` a second time.
Expected: identical output, no duplicate-key error.

Then in the SQL Editor:

```sql
select count(*) from properties;          -- Expected: 4
select count(*) from property_images;     -- Expected: 12
select count(*) from project_milestones;  -- Expected: 5
```

- [ ] **Step 6: Commit**

```bash
git add scripts/seed.ts package.json package-lock.json
git commit -m "feat: seed existing properties and example project"
```

---

### Task 7: Render properties from the database

**Files:**
- Modify: `components/Properties.tsx` (full rewrite — currently a client component with a hardcoded array)
- Modify: `app/[locale]/page.tsx` (add revalidation)
- Modify: `messages/bs.json`, `messages/en.json` (add `properties.empty`)

**Interfaces:**
- Consumes: `getFeaturedProperties` from `lib/data/properties.ts`; `Locale` from `lib/localized.ts`.
- Produces: `<Properties />` — an async server component taking no props.

- [ ] **Step 1: Add the empty-state translations**

In `messages/bs.json`, inside `"properties"`, add:

```json
"empty": "Uskoro objavljujemo nove nekretnine. Kontaktirajte nas za trenutnu ponudu."
```

In `messages/en.json`, inside `"properties"`, add:

```json
"empty": "New properties are coming soon. Contact us for the current offer."
```

- [ ] **Step 2: Rewrite the component**

Replace the entire contents of `components/Properties.tsx`:

```tsx
import Image from 'next/image';
import { getLocale, getTranslations } from 'next-intl/server';
import { MapPin, Home } from 'lucide-react';
import { getFeaturedProperties } from '@/lib/data/properties';
import type { Locale } from '@/lib/localized';

export async function Properties() {
  const locale = (await getLocale()) as Locale;
  const t = await getTranslations('properties');
  const properties = await getFeaturedProperties(locale);

  return (
    <section id="properties" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            {t('title')}
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            {t('subtitle')}
          </p>
        </div>

        {properties.length === 0 ? (
          <p className="text-center text-lg text-gray-500 py-12">{t('empty')}</p>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {properties.map((property) => (
              <div
                key={property.id}
                className="group relative overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 cursor-pointer"
              >
                <div className="relative h-80 overflow-hidden bg-gray-100">
                  {property.coverImage && (
                    <Image
                      src={property.coverImage}
                      alt={property.coverAlt}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-500"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>

                <div className="absolute bottom-0 left-0 right-0 p-6 text-white transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                  <div className="flex items-center space-x-2 mb-2">
                    <Home size={18} />
                    <span className="font-semibold">{property.title}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <MapPin size={18} />
                    <span>{property.location}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="text-center mt-12">
          <a
            href="#contact"
            className="inline-flex items-center px-8 py-4 bg-gold-600 hover:bg-gold-700 text-white font-semibold rounded-lg transition-all duration-300 hover:scale-105 shadow-lg"
          >
            {t('viewAll')}
          </a>
        </div>
      </div>
    </section>
  );
}
```

Note: the `'use client'` directive is gone, and the `types.villa` / `locations.sarajevo` translation lookups are gone too — the card now shows the property's real title from the database instead of a generic type label. The `properties.types` and `properties.locations` translation keys stay in the message files for now; Phase 3 uses them for the filter controls.

- [ ] **Step 3: Add revalidation to the homepage**

At the top of `app/[locale]/page.tsx`, below the imports, add:

```tsx
// Re-fetch properties from the database at most every 5 minutes.
export const revalidate = 300;
```

- [ ] **Step 4: Verify the whole test suite still passes**

Run: `npm test`
Expected: PASS, 18 tests across 3 files.

- [ ] **Step 5: Verify the build succeeds**

Run: `npm run build`
Expected: build completes with no errors.

- [ ] **Step 6: Verify the build also succeeds without Supabase configured**

```bash
mv .env.local .env.local.bak
npm run build
mv .env.local.bak .env.local
```

Expected: the build still completes. The homepage renders the empty-state message rather than crashing. If this fails, `createAnonClient` is throwing where it should return `null`.

- [ ] **Step 7: Verify in the browser**

Run: `npm run dev`, then open `http://localhost:3000`.

Check:
- The Properties section shows four cards, not six.
- Each card shows its real title ("Vila sa jezerom", not "Villa").
- Cover images load; hovering scales the image and reveals the gradient.
- `http://localhost:3000/en` shows English titles.

- [ ] **Step 8: Commit**

```bash
git add components/Properties.tsx app/[locale]/page.tsx messages/
git commit -m "feat: render homepage properties from the database"
```

---

## Done when

- `npm test` passes.
- `npm run build` passes both with and without `.env.local`.
- The homepage renders four seeded properties in both languages.
- An anonymous `POST` to the Supabase REST API is refused (Task 2, Step 6).
- `components/Properties.tsx` contains no hardcoded property data.

## Next phase

Phase 2 (admin panel) builds on `createAdminClient`, the `admins` table, and the
`is_admin()` policy function created here. Its plan gets written once this phase is
running, so it can be based on what actually exists rather than on prediction.
