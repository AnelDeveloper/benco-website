# Phase 2 security verification

Run against the live Supabase project and a local dev server, 2026-09-22.

## 1. Admin pages reject visitors with no session

```
/admin                     307 -> /admin/login
/admin/properties          307 -> /admin/login
/admin/properties/new      307 -> /admin/login
/admin/projects            307 -> /admin/login
/admin/stats               307 -> /admin/login
```

## 2. A server action cannot be called without a session

Server actions are POST endpoints; anyone can call one directly, so each action
re-checks the session rather than trusting the page that rendered it.

```
properties before: 4
POST /admin/properties/new (no session)  ->  HTTP 307 -> /admin/login
properties after:  4
rows with title_bs = 'HACK': 0
```

## 3. A valid Supabase user who is not an admin is refused

`notadmin@example.com` was created in Supabase Auth with a known password and
was absent from both `ADMIN_EMAILS` and the `admins` table.

Logging in with the **correct** password returned `Pogrešan email ili lozinka.`
— the same message a wrong password produces — and stayed on `/admin/login`.
The generic message is deliberate: distinguishing "wrong password" from "not an
admin" confirms to a stranger that the credentials are real.

Test user deleted afterwards; only the owner's account remains.

## 4. The service-role key never reaches the browser

```
files in .next/static referencing sb_secret_ or SUPABASE_SERVICE_ROLE_KEY: 0
```

`lib/supabase/admin.ts` opens with `import 'server-only'`, so a client component
importing it fails the build rather than shipping the key.

## 5. Anonymous database access stays read-only

Re-verified from Phase 1 and unchanged: the anon key reads published rows only,
returns no guest data, and is refused on write with `HTTP 401` and
`new row violates row-level security policy`.
