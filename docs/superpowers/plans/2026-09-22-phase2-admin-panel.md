# Ben&Co Phase 2: Admin Panel — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.

**Goal:** A Bosnian-only admin panel at `/admin` where the owner logs in and manages properties, construction projects, milestones, and the homepage statistics — replacing all use of the Supabase dashboard.

**Architecture:** Supabase Auth with cookie sessions via `@supabase/ssr`. Middleware refreshes the session on `/admin` requests. Every page and every server action independently verifies the session server-side and checks the email against `ADMIN_EMAILS`. Writes run through the service-role client *after* that check passes.

**Tech Stack:** Next.js 15 server actions, `@supabase/ssr`, `zod` for validation, Vitest.

**Spec:** `docs/superpowers/specs/2026-09-22-benco-platform-design.md`
**Builds on:** `docs/superpowers/plans/2026-09-22-phase1-foundation.md`

## Global Constraints

- `/admin` lives outside `app/[locale]/` and is **not localized** — Bosnian strings are written directly in the components.
- Every server action re-verifies the admin session. An action that trusts the page that rendered it is a hole: server actions are POST endpoints anyone can call.
- `SUPABASE_SERVICE_ROLE_KEY` is used only after `requireAdmin()` has passed.
- Being authenticated is not enough — the email must be in `ADMIN_EMAILS` *and* in the `admins` table (the database enforces the second).
- No signup, no password reset, no "remember me". One account, created in the Supabase dashboard.
- Uploaded images go to the `property-images` / `project-images` buckets, never to `public/`.

---

### Task 1: Admin identity and session

**Files:** `lib/auth/admin.ts`, `lib/auth/admin.test.ts`, `lib/supabase/server.ts`, `middleware.ts`

**Produces:**
- `isAdminEmail(email, adminEmailsEnv): boolean` — pure, case-insensitive, trims, ignores empty entries
- `createServerSupabase(): Promise<SupabaseClient>` — cookie-backed client for reading the session
- `getAdminUser(): Promise<{ email: string } | null>`
- `requireAdmin(): Promise<{ email: string }>` — redirects to `/admin/login` when absent

- [ ] **Step 1:** Write `lib/auth/admin.test.ts` covering `isAdminEmail`: exact match; case-insensitive; surrounding whitespace; comma-separated list; empty env returns false; email not in list returns false; empty/undefined email returns false.
- [ ] **Step 2:** Run `npm test -- lib/auth/admin.test.ts` — expect failure (module missing).
- [ ] **Step 3:** Implement `isAdminEmail`, `createServerSupabase` (via `createServerClient` from `@supabase/ssr` with Next 15 async `cookies()`), `getAdminUser`, `requireAdmin`.
- [ ] **Step 4:** Run the test — expect pass.
- [ ] **Step 5:** Rewrite `middleware.ts` to branch: paths starting `/admin` go through Supabase session refresh (and redirect to `/admin/login` when there is no session, except on `/admin/login` itself); everything else goes to the existing next-intl middleware. Add `/admin/:path*` to the matcher.
- [ ] **Step 6:** `npx tsc --noEmit`, then commit.

---

### Task 2: Login and logout

**Files:** `app/admin/login/page.tsx`, `app/admin/_actions/auth.ts`, `app/admin/layout.tsx`

**Consumes:** `isAdminEmail`, `createServerSupabase`, `requireAdmin`.
**Produces:** `signIn(formData)`, `signOut()` server actions.

- [ ] **Step 1:** Build `/admin/login` — a centred card, email + password, Bosnian labels ("Prijava", "Email", "Lozinka", "Prijavi se"), error shown above the form.
- [ ] **Step 2:** Implement `signIn`: validate with zod, `signInWithPassword`, then **check `isAdminEmail`** — if the user authenticates but is not an admin, sign them straight back out and show the same generic error. Never reveal which half failed.
- [ ] **Step 3:** Implement `signOut` and redirect to `/admin/login`.
- [ ] **Step 4:** Build `app/admin/layout.tsx` — calls `requireAdmin()`, renders the sidebar (Pregled, Nekretnine, Projekti, Statistika) and a logout button. The login page must not inherit this layout's guard; put the guard in a `(panel)` route group so `/admin/login` sits outside it.
- [ ] **Step 5:** Verify manually: visiting `/admin` while logged out lands on `/admin/login`; wrong password shows the error; correct login reaches the dashboard; logout returns to login; `/admin` is again refused.
- [ ] **Step 6:** Commit.

---

### Task 3: Shared admin form pieces and validation

**Files:** `lib/validation/property.ts`, `lib/validation/property.test.ts`, `lib/slug.ts`, `lib/slug.test.ts`, `components/admin/*`

**Produces:**
- `slugify(text): string` — Bosnian diacritics folded (č/ć→c, š→s, ž→z, đ→d), lowercased, non-alphanumerics collapsed to single dashes, trimmed
- `propertySchema` / `projectSchema` (zod), and `parseProperty(formData)` returning typed data or field errors

- [ ] **Step 1:** Write `lib/slug.test.ts`: "Vila sa jezerom" → `vila-sa-jezerom`; "Apartman Dacha 2" → `apartman-dacha-2`; diacritics "Ššećer Žđ" folded; multiple spaces/dashes collapse; leading/trailing dashes stripped; empty string → empty string.
- [ ] **Step 2:** Run, expect failure. Implement `slugify`. Run, expect pass.
- [ ] **Step 3:** Write `lib/validation/property.test.ts`: rejects empty title; rejects a `rent` listing with no `price_per_night`; rejects a `sale` listing with no `price`; accepts `both` with both prices; coerces numeric strings from FormData; rejects `progress_percent` outside 0–100 for projects.
- [ ] **Step 4:** Run, expect failure. Implement the schemas. Run, expect pass.
- [ ] **Step 5:** Build shared UI: `AdminInput`, `AdminTextarea`, `AdminSelect`, `AdminCheckbox`, `SubmitButton` (with `useFormStatus` pending state), `FieldError`.
- [ ] **Step 6:** Commit.

---

### Task 4: Properties CRUD

**Files:** `app/admin/(panel)/properties/page.tsx`, `.../properties/new/page.tsx`, `.../properties/[id]/page.tsx`, `app/admin/_actions/properties.ts`, `components/admin/PropertyForm.tsx`, `lib/data/admin-properties.ts`

**Produces:** `createProperty`, `updateProperty`, `deleteProperty`, `togglePublished` server actions; `listPropertiesForAdmin()`.

- [ ] **Step 1:** `listPropertiesForAdmin()` — all properties including unpublished, newest first, with cover image and image count.
- [ ] **Step 2:** List page — table: cover thumbnail, title, type, location, price, published badge, edit/delete. Empty state with a "Dodaj nekretninu" call to action.
- [ ] **Step 3:** `PropertyForm` — bilingual title/description side by side, type, listing mode, location, address, prices, m², rooms, max guests, features (comma-separated), published and featured switches, sort order.
- [ ] **Step 4:** Server actions. **Each begins with `await requireAdmin()`.** Slug auto-generated from `title_bs` on create, kept stable on edit. `revalidatePath('/')` after every write so the public homepage updates.
- [ ] **Step 5:** Delete behind a confirmation step (a small client component, not `window.confirm` — modal dialogs block the page).
- [ ] **Step 6:** Verify manually: create a property unpublished → absent from the homepage; publish it → appears; edit the title → changes on the homepage; delete → gone.
- [ ] **Step 7:** Commit.

---

### Task 5: Photo upload and ordering

**Files:** `app/admin/_actions/images.ts`, `components/admin/ImageManager.tsx`, `lib/storage.ts`, `lib/storage.test.ts`

**Produces:** `uploadPropertyImage(formData)`, `deletePropertyImage(id)`, `reorderImages(ids)`; `storagePathFor(propertyId, filename)`, `publicUrlFor(bucket, path)`.

- [ ] **Step 1:** Write `lib/storage.test.ts`: `storagePathFor` produces `<id>/<timestamp>-<slugified-name>.<ext>`; rejects paths containing `..` or `/`; preserves the extension; lowercases it.
- [ ] **Step 2:** Run, expect failure. Implement. Run, expect pass.
- [ ] **Step 3:** `uploadPropertyImage` — `requireAdmin()`, validate the file is an image under 8 MB, upload to `property-images`, insert a `property_images` row with `sort_order` = current max + 1.
- [ ] **Step 4:** `ImageManager` — grid of current photos, first one badged "Naslovna", up/down arrows to reorder, delete per photo, upload input accepting multiple files.
- [ ] **Step 5:** Deleting a photo removes both the storage object and the row. An orphaned storage object is a slow leak; an orphaned row is a broken image.
- [ ] **Step 6:** Verify manually: upload two photos, reorder, confirm the homepage cover changes, delete one, confirm it disappears from both the panel and the bucket.
- [ ] **Step 7:** Commit.

---

### Task 6: Projects, milestones, and statistics

**Files:** `app/admin/(panel)/projects/*`, `app/admin/_actions/projects.ts`, `components/admin/ProjectForm.tsx`, `components/admin/MilestoneEditor.tsx`, `app/admin/(panel)/stats/page.tsx`, `app/admin/_actions/stats.ts`

- [ ] **Step 1:** Projects list and form — all spec fields, including the two offer toggles and a progress slider showing its percentage live.
- [ ] **Step 2:** `MilestoneEditor` — add, edit, reorder, and mark done inline; each row is title bs/en, target date, done checkbox.
- [ ] **Step 3:** Project images reuse the `ImageManager` from Task 5, parameterised by bucket and table.
- [ ] **Step 4:** Stats page — the four counters in one small form.
- [ ] **Step 5:** All actions call `requireAdmin()` and `revalidatePath('/')`.
- [ ] **Step 6:** Commit.

---

### Task 7: Dashboard and security verification

**Files:** `app/admin/(panel)/page.tsx`, `docs/superpowers/verification/phase2-security.md`

- [ ] **Step 1:** Dashboard — counts of properties (published/total), projects, and a "what to do next" hint when something is empty.
- [ ] **Step 2:** Security verification, recorded with its output:
  - `curl` a server action endpoint without a session → not executed
  - `/admin/properties` while logged out → redirect to login
  - a Supabase user whose email is absent from `ADMIN_EMAILS` → refused at login
  - `grep` the built client bundle for the service-role key → absent
- [ ] **Step 3:** `npm test`, `npx tsc --noEmit`, `npm run build` all green.
- [ ] **Step 4:** Commit.

## Done when

- Logging in at `/admin` works; logging out revokes access.
- A property can be created, photographed, published, edited, and deleted entirely from the panel.
- A project with milestones can be managed the same way.
- Changes appear on the public homepage without a redeploy.
- Every security check in Task 7 passes.
