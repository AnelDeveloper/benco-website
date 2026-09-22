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
