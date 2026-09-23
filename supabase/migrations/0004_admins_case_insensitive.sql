-- Match admin emails case-insensitively.
--
-- Supabase stores the address as typed at sign-up, so Realestatebenco@gmail.com
-- and realestatebenco@gmail.com could otherwise be different people to the
-- database — one of them locked out of every write with no useful error.
create or replace function is_admin() returns boolean as $$
  select exists (
    select 1 from admins
    where lower(email) = lower(auth.jwt() ->> 'email')
  );
$$ language sql stable security definer set search_path = public;
